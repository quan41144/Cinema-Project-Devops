package ra.cinemaservice.service;

import ra.cinemaservice.dto.*;
import ra.cinemaservice.entity.Movie;
import ra.cinemaservice.entity.Showtime;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface IMovieShowtimeService {
    List<MovieSummaryDto> findMovies(String status);
    MovieDetailDto getMovieDetail(Long id);
    MovieDetailDto createMovie(CreateMovieRequest req);
    List<CategoryDto> findAllCategories();
    List<ShowtimeSummaryDto> findShowtimes(LocalDate date, Long movieId);
    ShowtimeSummaryDto createShowtime(CreateShowtimeRequest req);
    ShowtimeSeatMapDto getSeatMapWithPrices(Long showtimeId);
    MovieSummaryDto toMovieSummary(Movie m);
    MovieDetailDto toMovieDetail(Movie m);
    ShowtimeSummaryDto toShowtimeSummary(Showtime st, LocalDateTime now);
}
