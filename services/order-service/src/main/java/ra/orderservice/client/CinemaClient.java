package ra.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ra.orderservice.client.dto.HoldSeatsRequest;
import ra.orderservice.client.dto.HoldSeatsResponse;
import ra.orderservice.client.dto.OrderActionRequest;

@FeignClient(name = "cinema-service", url = "${services.cinema-url}")
public interface CinemaClient {
    @PostMapping("/api/v1/showtimes/{id}/seats/hold")
    HoldSeatsResponse holdSeats(@PathVariable("id") Long showtimeId, @RequestBody HoldSeatsRequest request);

    @PostMapping("/api/v1/showtimes/{id}/seats/confirm")
    void confirmSeats(@PathVariable("id") Long showtimeId, @RequestBody OrderActionRequest request);

    @PostMapping("/api/v1/showtimes/{id}/seats/release")
    void releaseSeats(@PathVariable("id") Long showtimeId, @RequestBody OrderActionRequest request);
}
