package ra.cinemaservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "seat_code"}))
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    @Column(name = "seat_code", nullable = false, length = 10)
    private String seatCode;
    @Column(name = "row_label", nullable = false, length = 5)
    private String rowLabel;
    @Column(name = "col_number", nullable = false)
    private Integer colNumber;
    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;
}
