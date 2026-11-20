package ra.cinemaservice.dto;

import java.time.LocalDate;
import java.util.List;

public record MovieSummaryDto(
        Long id,
        String title,
        String slug,
        String posterUrl,
        String ageRating,
        Integer durationMinutes,
        LocalDate releaseDate,
        String status,
        List<String> categories
) {
}
