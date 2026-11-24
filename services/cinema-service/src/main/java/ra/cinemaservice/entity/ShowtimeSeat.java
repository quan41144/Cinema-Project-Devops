package ra.cinemaservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Table(name = "showtime_seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"showtime_id", "seat_code"}))
public class ShowtimeSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    @Column(name = "seat_code", nullable = false, length = 10)
    private String seatCode;

    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;
}
