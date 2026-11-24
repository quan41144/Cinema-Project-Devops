package ra.customerservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ra.customerservice.entity.RefreshToken;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @Query("select rt from RefreshToken rt join fetch rt.customer c left join fetch c.wallet where rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashWithCustomer(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("update RefreshToken rt set rt.revoked = true where rt.customer.id = :customerId and rt.revoked = false")
    int revokeAllActiveByCustomerId(@Param("customerId") Long customerId);

    @Modifying
    @Query("delete from RefreshToken rt where rt.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
