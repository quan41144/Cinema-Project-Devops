package ra.cinemaservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateShowtimeRequest(
        @NotNull Long movieId,
        @NotNull Long roomId,
        @NotBlank String format,
        @NotNull LocalDate showDate,
        @NotNull LocalTime startTime
) {
}
