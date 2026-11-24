package ra.customerservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ra.customerservice.entity.Customer;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByEmailIgnoreCase(String email);
    Optional<Customer> findByEmailIgnoreCase(String email);
    @Query("select c from Customer c left join fetch c.wallet order by c.id asc")
    List<Customer> findAllWithWallet();
    @Query("select c from Customer c left join fetch c.wallet where c.id = :id")
    Optional<Customer> findByIdWithWallet(Long id);
}
