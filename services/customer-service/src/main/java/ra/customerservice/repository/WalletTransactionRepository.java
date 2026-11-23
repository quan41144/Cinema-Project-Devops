package ra.customerservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ra.customerservice.entity.WalletTransaction;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<WalletTransaction> findByOrderIdAndType(Long orderId, String type);
}
