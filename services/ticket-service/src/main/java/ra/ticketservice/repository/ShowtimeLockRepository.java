package ra.ticketservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.ticketservice.entity.ShowtimeLock;

import java.util.List;

@Repository
public interface ShowtimeLockRepository extends JpaRepository<ShowtimeLock, Long> {
    List<ShowtimeLock> findAllByOrderByShowtimeIdAsc();
}
