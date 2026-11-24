package ra.cinemaservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.cinemaservice.dto.HoldSeatsRequest;
import ra.cinemaservice.dto.HoldSeatsResponse;
import ra.cinemaservice.dto.SeatPriceItemDto;
import ra.cinemaservice.entity.Showtime;
import ra.cinemaservice.entity.ShowtimeSeat;
import ra.cinemaservice.repository.ShowtimeRepository;
import ra.cinemaservice.repository.ShowtimeSeatRepository;
import ra.cinemaservice.service.ISeatReservationService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatReservationService implements ISeatReservationService {
    private static final Logger log = LoggerFactory.getLogger(SeatReservationService.class);
    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final PricingService pricingService;
    @Transactional
    @Override
    public HoldSeatsResponse holdSeats(Long showtimeId, HoldSeatsRequest req) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy suất chiếu"));
        List<ShowtimeSeat> seats = showtimeSeatRepository.findForUpdate(showtimeId, req.seatCodes());
        if (seats.size() != req.seatCodes().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã ghế không tồn tại");
        }
        LocalDateTime now = LocalDateTime.now();
        for (ShowtimeSeat seat : seats) {
            boolean holdExpired = "HELD".equals(seat.getStatus())
                    && seat.getHoldExpiresAt() != null
                    && seat.getHoldExpiresAt().isBefore(now);
            if (!"AVAILABLE".equals(seat.getStatus()) && !holdExpired) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ghế " + seat.getSeatCode() + " đã có người đặt");
            }
            seat.setStatus("HELD");
            seat.setOrderId(req.orderId());
            seat.setHoldExpiresAt(now.plusMinutes(10));
        }
        showtimeSeatRepository.saveAll(seats);
        List<SeatPriceItemDto> pricedSeats = seats.stream()
                .map(s -> new SeatPriceItemDto(
                        s.getSeatId(),
                        s.getSeatCode(),
                        s.getSeatType(),
                        pricingService.calculateSeatPrice(showtime, s.getSeatType())
                )).toList();
        BigDecimal totalAmount = pricedSeats.stream()
                .map(SeatPriceItemDto::unitPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        log.info("[Cinema] Giữ {} ghế {} cho orderId={} suất chiếu {}",
                seats.size(), req.seatCodes(), req.orderId(), showtimeId);
        return new HoldSeatsResponse(
                showtime.getId(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                showtime.getRoom().getName(),
                showtime.getFormat(),
                LocalDateTime.of(showtime.getShowDate(), showtime.getStartTime()),
                pricedSeats,
                totalAmount
        );
    }
    @Transactional
    @Override
    public void confirmSeats(Long showtimeId, Long orderId) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdAndOrderId(showtimeId, orderId);
        seats.forEach(s -> {
            s.setStatus("BOOKED");
            s.setHoldExpiresAt(null);
        });
        showtimeSeatRepository.saveAll(seats);
        log.info("[Cinema] Đã đặt {} ghế cho orderId={}", seats.size(), orderId);
    }
    @Transactional
    @Override
    public void releaseSeats(Long showtimeId, Long orderId) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdAndOrderId(showtimeId, orderId);
        seats.forEach(s -> {
            s.setStatus("AVAILABLE");
            s.setOrderId(null);
            s.setHoldExpiresAt(null);
        });
        showtimeSeatRepository.saveAll(seats);
        log.warn("[Cinema] Đã trả {} ghế về AVAILABLE cho orderId={}", seats.size(), orderId);
    }
}
