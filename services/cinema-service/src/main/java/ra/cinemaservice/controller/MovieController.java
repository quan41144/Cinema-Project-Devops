package ra.cinemaservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ra.cinemaservice.dto.CategoryDto;
import ra.cinemaservice.dto.CreateMovieRequest;
import ra.cinemaservice.dto.MovieDetailDto;
import ra.cinemaservice.dto.MovieSummaryDto;
import ra.cinemaservice.service.impl.MovieShowtimeService;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MovieController {
    private final MovieShowtimeService movieShowtimeService;

    @GetMapping("/movies")
    public List<MovieSummaryDto> listMovies(@RequestParam(required = false) String status) {
        return movieShowtimeService.findMovies(status);
    }

    @GetMapping("/movies/{id}")
    public MovieDetailDto getMovieDetail(@PathVariable Long id) {
        return movieShowtimeService.getMovieDetail(id);
    }

    @PostMapping("/movies")
    @ResponseStatus(HttpStatus.CREATED)
    public MovieDetailDto createMovie(@Valid @RequestBody CreateMovieRequest req) {
        return movieShowtimeService.createMovie(req);
    }

    @GetMapping("/categories")
    public List<CategoryDto> listCategories() {
        return movieShowtimeService.findAllCategories();
    }
}
