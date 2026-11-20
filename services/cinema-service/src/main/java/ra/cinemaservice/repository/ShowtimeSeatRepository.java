package ra.cinemaservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ra.cinemaservice.entity.ShowtimeSeat;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ShowtimeSeat s where s.showtime.id = :showtimeId and s.seatCode in :seatCodes")
    List<ShowtimeSeat> findForUpdate(Long showtimeId, List<String> seatCodes);

    List<ShowtimeSeat> findByShowtimeIdAndOrderId(Long showtimeId, Long orderId);

    List<ShowtimeSeat> findByShowtimeIdOrderByIdAsc(Long showtimeId);

    @Query("""
select count(s) from ShowtimeSeat s
where s.showtime.id = :showtimeId
and (s.status = 'AVAILABLE' or (s.status = 'HELD' and s.holdExpiresAt < :now))
""")
    Long countAvailableSeats(Long showtimeId, LocalDateTime now);

    List<ShowtimeSeat> findByShowtimeIdOrderByIdAs(Long showtimeId);
}
