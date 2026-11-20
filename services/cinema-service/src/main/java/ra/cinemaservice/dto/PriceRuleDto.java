package ra.cinemaservice.dto;

import java.math.BigDecimal;
import java.time.LocalTime;

public record PriceRuleDto(
        Long id,
        String format,
        String dayType,
        String timeSlot,
        LocalTime startHour,
        LocalTime endHour,
        String seatType,
        BigDecimal basePrice,
        BigDecimal longMovieSurcharge
) {
}
