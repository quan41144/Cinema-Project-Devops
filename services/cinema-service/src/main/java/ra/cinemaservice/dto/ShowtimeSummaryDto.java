package ra.cinemaservice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ShowtimeSummaryDto(
        Long id,
        Long movieId,
        String movieTitle,
        String posterUrl,
        String ageRating,
        Integer durationMinutes,
        Long roomId,
        String roomName,
        String format,
        LocalDate showDate,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal standardPrice,
        long availableSeats
) {
}
