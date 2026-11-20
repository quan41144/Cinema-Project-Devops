package ra.cinemaservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateMovieRequest(
        @NotBlank String title,
        @NotBlank String slug,
        String posterUrl,
        String backdropUrl,
        @NotBlank String ageRating,
        @NotNull @Min(1) Integer durationMinutes,
        LocalDate releaseDate,
        @NotBlank String status,
        List<Long> categoryIds,
        String country,
        String director,
        String castList,
        String synopsisShort,
        String synopsisFull,
        String trailerUrl,
        String ratingDescription
) {
}
