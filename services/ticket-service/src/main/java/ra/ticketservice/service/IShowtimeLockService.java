package ra.ticketservice.service;

import ra.ticketservice.dto.ShowtimeLockRequest;
import ra.ticketservice.dto.ShowtimeLockResponse;
import ra.ticketservice.entity.ShowtimeLock;

import java.util.List;
import java.util.Optional;

public interface IShowtimeLockService {
    ShowtimeLockResponse updateLock(Long showtimeId, ShowtimeLockRequest req);
    ShowtimeLockResponse getLock(Long showtimeId);
    List<ShowtimeLockResponse> listLocks();
    Optional<String> findActiveLockReason(Long showtimeId);
    ShowtimeLockResponse toResponse(ShowtimeLock lock);
}
