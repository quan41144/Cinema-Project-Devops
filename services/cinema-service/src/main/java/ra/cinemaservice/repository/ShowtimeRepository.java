package ra.cinemaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ra.cinemaservice.entity.Showtime;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    @Query("""
            select s from Showtime s
            join fetch s.movie
            join fetch s.room
            where s.status = 'OPEN'
            and (:date is null or s.showDate = :date)
            and (:movieId is null or s.movie.id = :movieId)
            order by s.showDate asc, s.startTime asc
""")
    List<Showtime> findOpenShowtimes(LocalDate date, Long movieId);
}
