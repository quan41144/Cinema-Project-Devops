package ra.cinemaservice.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ShowtimeSeatMapDto(
        Long showtimeId,
        Long movieId,
        String movieTitle,
        String roomName,
        Integer totalRows,
        Integer totalCols,
        String format,
        LocalDate showDate,
        LocalTime startTime,
        long availableSeats,
        List<SeatItemDto> seats
) {
}
