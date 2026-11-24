package ra.cinemaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.cinemaservice.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
}
