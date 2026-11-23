package ra.ticketservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "ticket_code", nullable = false, unique = true, length = 50)
    private String ticketCode;
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;
    @Column(name = "showtime_id", nullable = false)
    private Long showtimeId;
    @Column(name = "customer_id", nullable = false)
    private Long customerId;
    @Column(name = "movie_title_snapshot", nullable = false, length = 200)
    private String movieTitleSnapshot;
    @Column(name = "room_name_snapshot", nullable = false, length = 80)
    private String roomNameSnapshot;
    @Column(name = "show_datetime_snapshot", nullable = false)
    private LocalDateTime showDatetimeSnapshot;
    @Column(name = "seat_codes", nullable = false, length = 200)
    private String seatCodes;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;
    @PrePersist
    void onCreate() {
        if (this.issuedAt == null) {
            this.issuedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ISSUED";
        }
    }
}
