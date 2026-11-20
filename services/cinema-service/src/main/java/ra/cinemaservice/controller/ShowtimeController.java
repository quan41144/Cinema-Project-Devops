package ra.cinemaservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ra.cinemaservice.dto.*;
import ra.cinemaservice.service.IMovieShowtimeService;
import ra.cinemaservice.service.ISeatReservationService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {
    private final IMovieShowtimeService showtimeService;
    private final ISeatReservationService seatReservationService;
    @GetMapping
    public List<ShowtimeSummaryDto> listShowtimes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) long movieId
            ){
        return showtimeService.findShowtimes(date, movieId);
    }
    @GetMapping("/{id}/seats")
    public ShowtimeSeatMapDto getSeatMap(@PathVariable Long id) {
        return showtimeService.getSeatMapWithPrices(id);
    }

    @PostMapping("/{id}/seats/hold")
    public HoldSeatsResponse holdSeats(@PathVariable Long id, @Valid @RequestBody HoldSeatsRequest req) {
        return seatReservationService.holdSeats(id, req);
    }

    @PostMapping("/{id}/seats/confirm")
    public ResponseEntity<Void> confirmSeats(@PathVariable Long id, @Valid @RequestBody OrderActionRequest req) {
        seatReservationService.confirmSeats(id, req.orderId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/seats/release")
    public ResponseEntity<Void> releaseSeats(@PathVariable Long id, @Valid @RequestBody OrderActionRequest req) {
        seatReservationService.releaseSeats(id, req.orderId());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShowtimeSummaryDto createShowtime(@Valid @RequestBody CreateShowtimeRequest req) {
        return showtimeService.createShowtime(req);
    }
}
