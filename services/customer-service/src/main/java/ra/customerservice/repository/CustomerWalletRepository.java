package ra.customerservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ra.customerservice.entity.CustomerWallet;

import java.util.Optional;

@Repository
public interface CustomerWalletRepository extends JpaRepository<CustomerWallet, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from CustomerWallet w join fetch w.customer where w.customer.id = :customerId")
    Optional<CustomerWallet> findByCustomerIdForUpdate(Long customerId);
    Optional<CustomerWallet> findByCustomerId(Long customerId);
}
