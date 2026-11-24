package ra.cinemaservice.service;

import ra.cinemaservice.entity.Showtime;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public interface IPricingService {
    BigDecimal calculateSeatPrice(Showtime showtime, String seatType);
    String resolveDayType(LocalDate date);
    String resolveTimeSlot(LocalTime time);
}
