package ra.cinemaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.cinemaservice.entity.TicketPriceRule;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketPriceRuleRepository extends JpaRepository<TicketPriceRule, Long> {
    Optional<TicketPriceRule> findByFormatAndDayTypeAndTimeSlotAndSeatType(String format, String dayType, String timeSlot, String seatType);
    List<TicketPriceRule> findAllByOrderByFormatAscDayTypeAscStartHourAscSeatTypeAsc();
}
