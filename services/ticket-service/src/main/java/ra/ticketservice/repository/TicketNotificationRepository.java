package ra.ticketservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.ticketservice.entity.TicketNotification;

import java.util.List;

@Repository
public interface TicketNotificationRepository extends JpaRepository<TicketNotification, Long> {
    List<TicketNotification> findByCustomerIdOrderBySentAtDesc(Long customerId);
    List<TicketNotification> findAllByOrderBySentAtDesc();
}
