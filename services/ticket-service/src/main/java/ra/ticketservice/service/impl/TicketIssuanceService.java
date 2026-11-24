package ra.ticketservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.ticketservice.dto.CreateNotificationRequest;
import ra.ticketservice.dto.IssueTicketRequest;
import ra.ticketservice.dto.TicketResponse;
import ra.ticketservice.entity.Ticket;
import ra.ticketservice.repository.TicketRepository;
import ra.ticketservice.service.INotificationService;
import ra.ticketservice.service.IShowtimeLockService;
import ra.ticketservice.service.ITicketIssuanceService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TicketIssuanceService implements ITicketIssuanceService {
    private static final Logger log = LoggerFactory.getLogger(TicketIssuanceService.class);
    private static final DateTimeFormatter CODE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final TicketRepository ticketRepository;
    private final IShowtimeLockService showtimeLockService;
    private final INotificationService notificationService;

    @Transactional
    @Override
    public TicketResponse issueTicket(IssueTicketRequest req) {
        Optional<String> activeLockReason = showtimeLockService.findActiveLockReason(req.showtimeId());
        if (activeLockReason.isPresent()) {
            String reason = activeLockReason.get();
            log.warn("[Ticket] Từ chối xuất vé cho orderId={}, showtimeId={}, customerId={}: {}",
                    req.orderId(), req.showtimeId(), req.customerId(), reason);
            throw new ResponseStatusException(HttpStatus.CONFLICT, reason);
        }

        Optional<Ticket> existing = ticketRepository.findByOrderId(req.orderId());
        if (existing.isPresent()) {
            log.info("[Ticket] Vé cho orderId={} đã được xuất trước đó: {}",
                    req.orderId(), existing.get().getTicketCode());
            return toResponse(existing.get());
        }

        String seatCodesJoined = String.join(",", req.seatCodes());
        String ticketCode = "CIN-" + LocalDate.now().format(CODE_DATE_FMT)
                + "-" + String.format("%04d", req.orderId());

        Ticket ticket = new Ticket();
        ticket.setTicketCode(ticketCode);
        ticket.setOrderId(req.orderId());
        ticket.setShowtimeId(req.showtimeId());
        ticket.setCustomerId(req.customerId());
        ticket.setMovieTitleSnapshot(req.movieTitle());
        ticket.setRoomNameSnapshot(req.roomName());
        ticket.setShowDatetimeSnapshot(req.showDateTime());
        ticket.setSeatCodes(seatCodesJoined);
        ticket.setStatus("ISSUED");

        Ticket saved = ticketRepository.save(ticket);

        notificationService.createNotification(new CreateNotificationRequest(
                req.customerId(),
                req.orderId(),
                "TICKET_ISSUED",
                "Đặt vé thành công - " + ticketCode,
                "Vé xem phim " + req.movieTitle() + " (" + req.roomName()
                        + ", ghế: " + seatCodesJoined + ") đã được phát hành."
        ));

        log.info("[Ticket] Xuất vé thành công ticketCode={} cho orderId={}, showtimeId={}",
                saved.getTicketCode(), saved.getOrderId(), saved.getShowtimeId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public TicketResponse getByOrderId(Long orderId) {
        Ticket ticket = ticketRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));
        return toResponse(ticket);
    }

    @Transactional(readOnly = true)
    @Override
    public List<TicketResponse> getByCustomerId(Long customerId) {
        return ticketRepository.findByCustomerIdOrderByIssuedAtDesc(customerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TicketResponse toResponse(Ticket t) {
        List<String> seats = (t.getSeatCodes() == null || t.getSeatCodes().isBlank())
                ? List.of()
                : Arrays.stream(t.getSeatCodes().split(",")).map(String::trim).toList();

        return new TicketResponse(
                t.getId(),
                t.getTicketCode(),
                t.getOrderId(),
                t.getShowtimeId(),
                t.getCustomerId(),
                t.getMovieTitleSnapshot(),
                t.getRoomNameSnapshot(),
                t.getShowDatetimeSnapshot(),
                seats,
                t.getStatus(),
                t.getIssuedAt()
        );
    }
}
