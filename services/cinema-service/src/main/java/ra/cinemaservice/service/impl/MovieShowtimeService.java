package ra.cinemaservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.cinemaservice.dto.*;
import ra.cinemaservice.entity.*;
import ra.cinemaservice.repository.*;
import ra.cinemaservice.service.IMovieShowtimeService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieShowtimeService implements IMovieShowtimeService {
    private final MovieRepository movieRepository;
    private final CategoryRepository categoryRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final PricingService pricingService;

    @Transactional(readOnly = true)
    @Override
    public List<MovieSummaryDto> findMovies(String status) {
        List<Movie> movies = (status != null && !status.isBlank())
                ? movieRepository.findByStatusOrderByReleaseDateDesc(status.toUpperCase())
                : movieRepository.findAllByOrderByReleaseDateDesc();
        return movies.stream().map(this::toMovieSummary).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public MovieDetailDto getMovieDetail(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phim"));
        return toMovieDetail(movie);
    }

    @Transactional
    @Override
    public MovieDetailDto createMovie(CreateMovieRequest req) {
        Movie movie = new Movie();
        movie.setTitle(req.title());
        movie.setSlug(req.slug());
        movie.setPosterUrl(req.posterUrl());
        movie.setBackdropUrl(req.backdropUrl());
        movie.setAgeRating(req.ageRating());
        movie.setDurationMinutes(req.durationMinutes());
        movie.setReleaseDate(req.releaseDate());
        movie.setStatus(req.status().toUpperCase());
        if (req.categoryIds() != null && !req.categoryIds().isEmpty()) {
            movie.setCategories(new HashSet<>(categoryRepository.findAllById(req.categoryIds())));
        }
        MovieDetail detail = new MovieDetail();
        detail.setCountry(req.country());
        detail.setDirector(req.director());
        detail.setCastList(req.castList());
        detail.setSynopsisShort(req.synopsisShort());
        detail.setSynopsisFull(req.synopsisFull());
        detail.setTrailerUrl(req.trailerUrl());
        detail.setRatingDescription(req.ratingDescription());
        detail.setMovie(movie);
        movie.setDetail(detail);

        return toMovieDetail(movieRepository.save(movie));
    }

    @Transactional(readOnly = true)
    @Override
    public List<CategoryDto> findAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<ShowtimeSummaryDto> findShowtimes(LocalDate date, Long movieId) {
        LocalDateTime now = LocalDateTime.now();
        return showtimeRepository.findOpenShowtimes(date, movieId).stream()
                .map(st -> toShowtimeSummary(st, now))
                .toList();
    }

    @Transactional
    @Override
    public ShowtimeSummaryDto createShowtime(CreateShowtimeRequest req) {
        Movie movie = movieRepository.findById(req.movieId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phim"));
        Room room = roomRepository.findById(req.roomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng chiếu"));
        Showtime showtime = new Showtime();
        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setFormat(req.format().toUpperCase());
        showtime.setShowDate(req.showDate());
        showtime.setStartTime(req.startTime());
        showtime.setEndTime(req.startTime().plusMinutes(movie.getDurationMinutes()));
        showtime.setStatus("OPEN");
        Showtime saved = showtimeRepository.save(showtime);

        List<Seat> roomSeats = seatRepository.findByRoomIdOrderByRowLabelAscColNumberAsc(room.getId());
        List<ShowtimeSeat> showtimeSeats = roomSeats.stream()
                .map(seat -> {
                    ShowtimeSeat ss = new ShowtimeSeat();
                    ss.setShowtime(saved);
                    ss.setSeatId(seat.getId());
                    ss.setSeatCode(seat.getSeatCode());
                    ss.setSeatType(seat.getSeatType());
                    ss.setStatus("AVAILABLE");
                    return ss;
                }).toList();
        showtimeSeatRepository.saveAll(showtimeSeats);
        return toShowtimeSummary(saved, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    @Override
    public ShowtimeSeatMapDto getSeatMapWithPrices(Long showtimeId) {
        Showtime st = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy suất chiếu"));
        LocalDateTime now = LocalDateTime.now();
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdOrderByIdAsc(showtimeId);

        List<SeatItemDto> items = seats.stream()
                .map(s -> {
                    boolean holdExpired = "HELD".equals(s.getStatus())
                            && s.getHoldExpiresAt() != null
                            && s.getHoldExpiresAt().isBefore(now);
                    String effectiveStatus = holdExpired ? "AVAILABLE" : s.getStatus();
                    BigDecimal price = pricingService.calculateSeatPrice(st, s.getSeatType());
                    return new SeatItemDto(s.getSeatId(), s.getSeatCode(), s.getSeatType(), effectiveStatus, price);
                }).toList();
        long availableCount = items.stream().filter(i -> "AVAILABLE".equals(i.status())).count();

        return new ShowtimeSeatMapDto(
                st.getId(),
                st.getMovie().getId(),
                st.getMovie().getTitle(),
                st.getRoom().getName(),
                st.getRoom().getTotalRows(),
                st.getRoom().getTotalCols(),
                st.getFormat(),
                st.getShowDate(),
                st.getStartTime(),
                availableCount,
                items
        );
    }

    @Override
    public MovieSummaryDto toMovieSummary(Movie m) {
        List<String> catNames = m.getCategories().stream().map(Category::getName).sorted().toList();
        return new MovieSummaryDto(
                m.getId(), m.getTitle(), m.getSlug(), m.getPosterUrl(),
                m.getAgeRating(), m.getDurationMinutes(), m.getReleaseDate(),
                m.getStatus(), catNames
        );
    }

    @Override
    public MovieDetailDto toMovieDetail(Movie m) {
        List<String> catNames = m.getCategories().stream().map(Category::getName).sorted().toList();
        MovieDetail d = m.getDetail();
        return new  MovieDetailDto(
                m.getId(), m.getTitle(), m.getSlug(), m.getPosterUrl(), m.getBackdropUrl(),
                m.getAgeRating(), m.getDurationMinutes(), m.getReleaseDate(), m.getStatus(),
                catNames,
                d != null ? d.getCountry() : null,
                d != null ? d.getDirector() : null,
                d != null ? d.getCastList() : null,
                d != null ? d.getSynopsisShort() : null,
                d != null ? d.getSynopsisFull() : null,
                d != null ? d.getTrailerUrl() : null,
                d != null ? d.getRatingDescription() : null
        );
    }

    @Override
    public ShowtimeSummaryDto toShowtimeSummary(Showtime st, LocalDateTime now) {
        BigDecimal standardPrice = pricingService.calculateSeatPrice(st, "STANDARD");
        long available = showtimeSeatRepository.countAvailableSeats(st.getId(), now);
        return new ShowtimeSummaryDto(
                st.getId(),
                st.getMovie().getId(),
                st.getMovie().getTitle(),
                st.getMovie().getPosterUrl(),
                st.getMovie().getAgeRating(),
                st.getMovie().getDurationMinutes(),
                st.getRoom().getId(),
                st.getRoom().getName(),
                st.getFormat(),
                st.getShowDate(),
                st.getStartTime(),
                st.getEndTime(),
                standardPrice,
                available
        );
    }
}
