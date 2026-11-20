package ra.cinemaservice.service;

import ra.cinemaservice.dto.HoldSeatsRequest;
import ra.cinemaservice.dto.HoldSeatsResponse;

public interface ISeatReservationService {
    HoldSeatsResponse holdSeats(Long showtimeId, HoldSeatsRequest req);
    void confirmSeats(Long showtimeId, Long orderId);
    void releaseSeats(Long showtimeId, Long orderId);
}
