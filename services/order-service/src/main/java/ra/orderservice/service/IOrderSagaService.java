package ra.orderservice.service;

import feign.FeignException;
import ra.orderservice.dto.CreateOrderRequest;
import ra.orderservice.dto.OrderResponse;
import ra.orderservice.entity.Order;

import java.util.List;

public interface IOrderSagaService {
    OrderResponse createOrder(CreateOrderRequest req);
    OrderResponse getOrderById(Long id);
    List<OrderResponse> listOrders(Long customerId);
}
