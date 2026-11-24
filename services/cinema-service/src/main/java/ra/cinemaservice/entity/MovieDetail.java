package ra.cinemaservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "movie_details")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class MovieDetail {
    @Id
    @Column(name = "movie_id")
    private Long movieId;
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "movie_id")
    private Movie movie;
    @Column(length = 80)
    private String country;
    @Column(length = 150)
    private String director;
    @Column(name = "cast_list", columnDefinition = "text")
    private String castList;
    @Column(name = "synopsis_short", length = 500)
    private String synopsisShort;
    @Column(name = "synopsis_full", columnDefinition = "text")
    private String synopsisFull;
    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;
    @Column(name = "rating_description", length = 300)
    private String ratingDescription;
}
