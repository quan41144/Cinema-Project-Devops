package ra.orderservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;
    @Column(name = "customer_id", nullable = false)
    private Long customerId;
    @Column(name = "showtime_id", nullable = false)
    private Long showtimeId;
    @Column(name = "movie_id")
    private Long movieId;
    @Column(name = "customer_name_snapshot", length = 120)
    private String customerNameSnapshot;
    @Column(name = "movie_title_snapshot", length = 200)
    private String movieTitleSnapshot;
    @Column(name = "room_name_snapshot", length = 80)
    private String roomNameSnapshot;
    @Column(name = "show_datetime_snapshot")
    private LocalDateTime showDatetimeSnapshot;
    @Column(name = "format_snapshot", length = 10)
    private String formatSnapshot;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(name = "ticket_code", length = 50)
    private String ticketCode;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;
    @Column(name = "trace_id", length = 64)
    private String traceId;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
