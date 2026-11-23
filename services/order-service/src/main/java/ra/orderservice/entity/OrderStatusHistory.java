package ra.orderservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_history")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(length = 255)
    private String note;
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    @PrePersist
    void onCreate() {
        if (this.changedAt == null) {
            this.changedAt = LocalDateTime.now();
        }
    }
}
