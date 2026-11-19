package ra.cinemaservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "ticket_price_rules")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class TicketPriceRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String format;

    @Column(name = "day_type", nullable = false, length = 20)
    private String dayType;

    @Column(name = "time_slot", nullable = false, length = 20)
    private String timeSlot;

    @Column(name = "start_hour", nullable = false)
    private LocalTime startHour;

    @Column(name = "end_hour", nullable = false)
    private LocalTime endHour;

    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "long_movie_surcharge", nullable = false, precision = 12, scale = 2)
    private BigDecimal longMovieSurcharge = BigDecimal.valueOf(10000);
}
