package ra.orderservice.service.impl;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.orderservice.client.CinemaClient;
import ra.orderservice.client.CustomerClient;
import ra.orderservice.client.TicketClient;
import ra.orderservice.client.dto.*;
import ra.orderservice.dto.CreateOrderRequest;
import ra.orderservice.dto.OrderItemDto;
import ra.orderservice.dto.OrderResponse;
import ra.orderservice.dto.OrderStatusHistoryDto;
import ra.orderservice.entity.Order;
import ra.orderservice.entity.OrderItem;
import ra.orderservice.entity.OrderStatusHistory;
import ra.orderservice.repository.OrderRepository;
import ra.orderservice.repository.OrderStatusHistoryRepository;
import ra.orderservice.service.IOrderSagaService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderSagaService implements IOrderSagaService {
    private static final Logger log = LoggerFactory.getLogger(OrderSagaService.class);
    private static final String DEFAULT_LOCK_REASON = "Suất chiếu đã khoá trước giờ chiếu";

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CinemaClient cinemaClient;
    private final CustomerClient customerClient;
    private final TicketClient ticketClient;
    private final ObjectMapper objectMapper;
    @Override
    public OrderResponse createOrder(CreateOrderRequest req) {
        String traceId = MDC.get("trace.id");
        Order order = new Order();
        order.setOrderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setCustomerId(req.customerId());
        order.setShowtimeId(req.showtimeId());
        order.setTotalAmount(BigDecimal.ZERO);
        order.setStatus("PENDING");
        order.setTraceId(traceId);

        order = orderRepository.save(order);
        recordHistory(order.getId(), "PENDING", "Khởi tạo đơn đặt vé");
        log.info("[Order] Tạo đơn orderId={} thành công, customerId={}, showtimeId={}, seats={}",
                order.getId(), req.customerId(), req.showtimeId(), req.seatCodes());
        HoldSeatsResponse holdRes;
        try {
            holdRes = cinemaClient.holdSeats(req.showtimeId(), new HoldSeatsRequest(order.getId(), req.seatCodes()));
        } catch (FeignException ex) {
            String reason = extractErrorMessage(ex, "Khong the giu ghe cho suat chieu nay");
            log.warn("[Order] Buoc 2 that bai cho orderId={}: {}", order.getId(), reason, ex);
            return cancelOrder(order, reason);
        }
        order.setMovieId(holdRes.movieId());
        order.setMovieTitleSnapshot(holdRes.movieTitle());
        order.setRoomNameSnapshot(holdRes.roomName());
        order.setFormatSnapshot(holdRes.format());
        order.setShowDatetimeSnapshot(holdRes.showDateTime());
        order.setTotalAmount(holdRes.totalAmount());
        for (SeatPriceItemDto seat : holdRes.seats()) {
            OrderItem item = new OrderItem();
            item.setSeatId(seat.seatId());
            item.setSeatCodeSnapshot(seat.seatCode());
            item.setSeatTypeSnapshot(seat.seatType());
            item.setUnitPriceSnapshot(seat.unitPrice());
            order.addItem(item);
        }
        order = orderRepository.save(order);
        log.info("[Order] Đã giữ {} ghế thành công, tổng tiền={} cho orderId={}",
                holdRes.seats().size(), holdRes.totalAmount(), order.getId());

        WalletOperationResponse debitRes;
        try {
            debitRes = customerClient.debit(req.customerId(), new WalletDebitRequest(
                    order.getId(),
                    holdRes.totalAmount(),
                    "Thanh toán đơn đặt vé " + order.getOrderCode() + " - " + holdRes.movieTitle()
            ));
        } catch (FeignException ex) {
            String reason = extractErrorMessage(ex, "Trừ tiền thất bại");
            log.warn("[Order] Thanh toán đơn orderId={} thất bại, tiền hành hủy giữ ghế: {}", order.getId(), reason, ex);
            safeReleaseSeats(req.showtimeId(), order.getId());
            return cancelOrder(order, reason);
        }

        order.setCustomerNameSnapshot(debitRes.customerName());
        order = orderRepository.save(order);
        log.info("[Order] Thanh toán thành công cho orderId={}, số dư còn lại={}",
                order.getId(), debitRes.balanceAfter());
        try {
            TicketResponse ticket = ticketClient.issueTicket(new IssueTicketRequest(
                    order.getId(),
                    req.showtimeId(),
                    req.customerId(),
                    holdRes.movieTitle(),
                    holdRes.roomName(),
                    holdRes.showDateTime(),
                    req.seatCodes()
            ));

            cinemaClient.confirmSeats(req.showtimeId(), new OrderActionRequest(order.getId()));

            order.setTicketCode(ticket.ticketCode());
            order.setStatus("CONFIRMED");
            order = orderRepository.save(order);
            recordHistory(order.getId(), "CONFIRMED", "Xuất vé thành công: " + ticket.ticketCode());
            log.info("[Order] Xác nhận thanh toán cho orderId={} thành công, ticketCode={}",
                    order.getId(), ticket.ticketCode());
            return toResponse(order);
        } catch (FeignException ex) {
            String reason = extractErrorMessage(ex, DEFAULT_LOCK_REASON);
            log.warn("[Order] Xuất vé cho orderId={} bị từ chối, Đang tiền hành hoàn tiền",
                    order.getId(), ex);

            customerClient.refund(req.customerId(), new WalletRefundRequest(
                    order.getId(), holdRes.totalAmount(), reason));
            safeReleaseSeats(req.showtimeId(), order.getId());
            safeNotifyCancellation(order, reason);
            return cancelOrder(order, reason);
        }
    }

    @Transactional(readOnly = true)
    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt vé"));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    @Override
    public List<OrderResponse> listOrders(Long customerId) {
        List<Order> orders = (customerId != null)
                ? orderRepository.findByCustomerIdWithItems(customerId)
                : orderRepository.findAllWithItems();
        return orders.stream().map(this::toResponse).toList();
    }

    public OrderResponse cancelOrder(Order order, String reason) {
        order.setStatus("CANCELLED");
        order.setCancelReason(reason);
        Order saved = orderRepository.save(order);
        recordHistory(saved.getId(), "CANCELLED", reason);
        log.info("[Order] Đã hủy đơn orderId={} thành công, reason={}", saved.getId(), reason);
        return toResponse(saved);
    }

    public void recordHistory(Long orderId, String status, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrderId(orderId);
        history.setStatus(status);
        history.setNote(note);
        orderStatusHistoryRepository.save(history);
    }

    public void safeReleaseSeats(Long showtimeId, Long orderId) {
        try {
            cinemaClient.releaseSeats(showtimeId, new OrderActionRequest(orderId));
        } catch (Exception releaseEx) {
            log.error("[Order] Lỗi khi hủy khóa ghế cho orderId={}", orderId, releaseEx);
        }
    }

    public void safeNotifyCancellation(Order order, String reason) {
        try {
            ticketClient.createNotification(new CreateNotificationRequest(
                    order.getCustomerId(),
                    order.getId(),
                    "BOOKING_CANCELLED",
                    "Đơn đặt vé " + order.getOrderCode() + " đã bị huỷ",
                    "Lý do: " + reason + ". Toàn bộ số tiền " + order.getTotalAmount() + "VNĐ đã được hoàn về ví."
            ));
        } catch (Exception notifyEx) {
            log.warn("[Order] Không gửi được thông báo hủy cho orderId={}", order.getId(), notifyEx);
        }
    }

    public String extractErrorMessage(FeignException ex, String fallback) {
        try {
            String body = ex.contentUTF8();
            if (body != null && !body.isBlank()) {
                JsonNode node = objectMapper.readTree(body);
                if (node.hasNonNull("message") && !node.get("message").asText().isBlank()) {
                    return node.get("message").asText();
                }
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    public OrderResponse toResponse(Order o) {
        List<OrderItemDto> itemDtos = o.getItems().stream()
                .map(i -> new OrderItemDto(
                        i.getSeatId(),
                        i.getSeatCodeSnapshot(),
                        i.getSeatTypeSnapshot(),
                        i.getUnitPriceSnapshot()
                ))
                .toList();

        List<String> seatCodes = itemDtos.stream().map(OrderItemDto::seatCode).toList();

        List<OrderStatusHistoryDto> historyDtos = orderStatusHistoryRepository.findByOrderIdOrderByChangedAtAsc(o.getId())
                .stream()
                .map(h -> new OrderStatusHistoryDto(h.getStatus(), h.getNote(), h.getChangedAt()))
                .toList();

        return new OrderResponse(
                o.getId(),
                o.getOrderCode(),
                o.getCustomerId(),
                o.getCustomerNameSnapshot(),
                o.getShowtimeId(),
                o.getMovieId(),
                o.getMovieTitleSnapshot(),
                o.getRoomNameSnapshot(),
                o.getFormatSnapshot(),
                o.getShowDatetimeSnapshot(),
                o.getTotalAmount(),
                o.getStatus(),
                o.getTicketCode(),
                o.getCancelReason(),
                o.getTraceId(),
                seatCodes,
                itemDtos,
                historyDtos,
                o.getCreatedAt()
        );
    }
}
