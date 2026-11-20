package ra.cinemaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.cinemaservice.entity.Movie;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByStatusOrderByReleaseDateDesc(String status);
    List<Movie> findAllByOrderByReleaseDateDesc();
}
