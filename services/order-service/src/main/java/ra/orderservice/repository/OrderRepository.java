package ra.orderservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ra.orderservice.entity.Order;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("select distinct o from Order o left join fetch o.items where o.id = :id")
    Optional<Order> findByIdWithItems(Long id);

    @Query("select distinct o from Order o left join fetch o.items where o.customerId = :customerId order by o.createdAt desc")
    List<Order> findByCustomerIdWithItems(Long customerId);

    @Query("select distinct o from Order o left join fetch o.items order by o.createdAt desc")
    List<Order> findAllWithItems();
}
