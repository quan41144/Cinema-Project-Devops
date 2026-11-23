package ra.ticketservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ra.ticketservice.dto.ShowtimeLockRequest;
import ra.ticketservice.dto.ShowtimeLockResponse;
import ra.ticketservice.entity.ShowtimeLock;
import ra.ticketservice.repository.ShowtimeLockRepository;
import ra.ticketservice.service.IShowtimeLockService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShowtimeLockService implements IShowtimeLockService {
    private static final Logger log = LoggerFactory.getLogger(ShowtimeLockService.class);
    public static final String DEFAULT_LOCK_REASON = "Suất chiếu đã khoá trước giờ chiếu";
    public static final long GLOBAL_LOCK_ID = 0L;

    private final ShowtimeLockRepository showtimeLockRepository;

    @Transactional
    @Override
    public ShowtimeLockResponse updateLock(Long showtimeId, ShowtimeLockRequest req) {
        ShowtimeLock lock = showtimeLockRepository.findById(showtimeId).orElseGet(() -> {
            ShowtimeLock created = new ShowtimeLock();
            created.setShowtimeId(showtimeId);
            return created;
        });

        lock.setLocked(Boolean.TRUE.equals(req.locked()));
        String reason = (req.reason() != null && !req.reason().isBlank())
                ? req.reason().trim()
                : DEFAULT_LOCK_REASON;
        lock.setLockReason(reason);

        ShowtimeLock saved = showtimeLockRepository.save(lock);
        log.info("[Ticket] Cập nhật khóa suất chiếu showtimeId={}, locked={}, reason={}",
                saved.getShowtimeId(), saved.isLocked(), saved.getLockReason());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public ShowtimeLockResponse getLock(Long showtimeId) {
        return showtimeLockRepository.findById(showtimeId)
                .map(this::toResponse)
                .orElseGet(() -> new ShowtimeLockResponse(showtimeId, false, DEFAULT_LOCK_REASON, null));
    }

    @Transactional(readOnly = true)
    @Override
    public List<ShowtimeLockResponse> listLocks() {
        return showtimeLockRepository.findAllByOrderByShowtimeIdAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<String> findActiveLockReason(Long showtimeId) {
        Optional<ShowtimeLock> specific = showtimeLockRepository.findById(showtimeId).filter(ShowtimeLock::isLocked);
        if (specific.isPresent()) {
            return Optional.of(specific.get().getLockReason());
        }
        return showtimeLockRepository.findById(GLOBAL_LOCK_ID)
                .filter(ShowtimeLock::isLocked)
                .map(ShowtimeLock::getLockReason);
    }

    @Override
    public ShowtimeLockResponse toResponse(ShowtimeLock lock) {
        return new ShowtimeLockResponse(
                lock.getShowtimeId(),
                lock.isLocked(),
                lock.getLockReason(),
                lock.getUpdatedAt()
        );
    }
}
