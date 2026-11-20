package ra.cinemaservice.dto;

import java.time.LocalDate;
import java.util.List;

public record MovieDetailDto(
        Long id,
        String title,
        String slug,
        String posterUrl,
        String backdropUrl,
        String ageRating,
        Integer durationMinutes,
        LocalDate releaseDate,
        String status,
        List<String> categories,
        String country,
        String director,
        String castList,
        String synopsisShort,
        String synopsisFull,
        String trailerUrl,
        String ratingDescription
) {
}
