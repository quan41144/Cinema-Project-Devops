package ra.ticketservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "showtime_locks")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ShowtimeLock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long showtimeId;
    @Column(name = "is_locked", nullable = false)
    private boolean locked = false;
    @Column(name = "lock_reason", nullable = false, length = 255)
    private String lockReason = "Suất chiếu đã khoá trước giờ chiếu";
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    @PrePersist
    @PreUpdate
    void onTouch() {
        this.updatedAt = LocalDateTime.now();
    }
}
