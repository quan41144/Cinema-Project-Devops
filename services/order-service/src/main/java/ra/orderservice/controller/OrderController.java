package ra.orderservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ra.orderservice.dto.CreateOrderRequest;
import ra.orderservice.dto.OrderResponse;
import ra.orderservice.service.IOrderSagaService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final IOrderSagaService orderSagaService;
    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest req) {
        return orderSagaService.createOrder(req);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        return orderSagaService.getOrderById(id);
    }

    @GetMapping
    public List<OrderResponse> listOrders(@RequestParam(required = false) Long customerId) {
        return orderSagaService.listOrders(customerId);
    }
}
