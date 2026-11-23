package ra.ticketservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_notifications")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class TicketNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "customer_id", nullable = false)
    private Long customerId;
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    @Column(nullable = false, length = 30)
    private String type;
    @Column(nullable = false, length = 150)
    private String title;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;
    @PrePersist
    void onCreate() {
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
        }
    }
}
