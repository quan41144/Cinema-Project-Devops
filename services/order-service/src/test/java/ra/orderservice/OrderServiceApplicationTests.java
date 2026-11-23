package ra.orderservice;

import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import ra.orderservice.client.CinemaClient;
import ra.orderservice.client.CustomerClient;
import ra.orderservice.client.TicketClient;
import ra.orderservice.client.dto.HoldSeatsResponse;
import ra.orderservice.client.dto.SeatPriceItemDto;
import ra.orderservice.client.dto.TicketResponse;
import ra.orderservice.client.dto.WalletOperationResponse;
import ra.orderservice.dto.CreateOrderRequest;
import ra.orderservice.dto.OrderResponse;
import ra.orderservice.service.IOrderSagaService;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@RequiredArgsConstructor
class OrderServiceApplicationTests {
    private final IOrderSagaService orderSagaService;

    @MockitoBean
    private CinemaClient cinemaClient;

    @MockitoBean
    private CustomerClient customerClient;

    @MockitoBean
    private TicketClient ticketClient;

    @Test
    void createOrderConfirmedHappyPath() {
        LocalDateTime showTime = LocalDateTime.of(2026, 11, 22, 18, 0);
        when(cinemaClient.holdSeats(eq(10L), any())).thenReturn(new HoldSeatsResponse(
                10L, 1L, "Cuoi Xuyen Bien Gioi", "Phong 2", "2D", showTime,
                List.of(new SeatPriceItemDto(1L, "D5", "VIP", BigDecimal.valueOf(85000))),
                BigDecimal.valueOf(85000)
        ));
        when(customerClient.debit(eq(1L), any())).thenReturn(new WalletOperationResponse(
                1L, "Nguyen Van A", 1L, "DEBIT", BigDecimal.valueOf(85000), BigDecimal.valueOf(415000), LocalDateTime.now()
        ));
        when(ticketClient.issueTicket(any())).thenReturn(new TicketResponse(
                1L, "CIN-20261122-0001", 1L, 10L, 1L, "Cuoi Xuyen Bien Gioi", "Phong 2", showTime,
                List.of("D5"), "ISSUED", LocalDateTime.now()
        ));

        OrderResponse res = orderSagaService.createOrder(new CreateOrderRequest(1L, 10L, List.of("D5")));

        assertThat(res.status()).isEqualTo("CONFIRMED");
        assertThat(res.ticketCode()).isEqualTo("CIN-20261122-0001");
        assertThat(res.totalAmount()).isEqualByComparingTo("85000");
        assertThat(res.history()).extracting("status").containsExactly("PENDING", "CONFIRMED");
        verify(cinemaClient).confirmSeats(eq(10L), any());
        verify(customerClient, never()).refund(any(), any());
        verify(cinemaClient, never()).releaseSeats(any(), any());
    }

    @Test
    void createOrderCompensatesWhenShowtimeLocked() {
        LocalDateTime showTime = LocalDateTime.of(2026, 11, 22, 18, 0);
        when(cinemaClient.holdSeats(eq(10L), any())).thenReturn(new HoldSeatsResponse(
                10L, 1L, "Cuoi Xuyen Bien Gioi", "Phong 2", "2D", showTime,
                List.of(new SeatPriceItemDto(2L, "D6", "VIP", BigDecimal.valueOf(85000))),
                BigDecimal.valueOf(85000)
        ));
        when(customerClient.debit(eq(1L), any())).thenReturn(new WalletOperationResponse(
                1L, "Nguyen Van A", 2L, "DEBIT", BigDecimal.valueOf(85000), BigDecimal.valueOf(415000), LocalDateTime.now()
        ));

        Request dummyReq = Request.create(Request.HttpMethod.POST, "/api/v1/tickets/issue",
                Collections.emptyMap(), null, new RequestTemplate());
        byte[] errBody = "{\"message\":\"Suất chiếu đã khoá trước giờ chiếu\"}".getBytes(StandardCharsets.UTF_8);
        when(ticketClient.issueTicket(any())).thenThrow(
                new FeignException.Conflict("Conflict", dummyReq, errBody, Collections.emptyMap())
        );

        OrderResponse res = orderSagaService.createOrder(new CreateOrderRequest(1L, 10L, List.of("D6")));

        assertThat(res.status()).isEqualTo("CANCELLED");
        assertThat(res.ticketCode()).isNull();
        assertThat(res.cancelReason()).isEqualTo("Suất chiếu đã khoá trước giờ chiếu");
        assertThat(res.history()).extracting("status").containsExactly("PENDING", "CANCELLED");
        verify(customerClient).refund(eq(1L), any());
        verify(cinemaClient).releaseSeats(eq(10L), any());
        verify(cinemaClient, never()).confirmSeats(any(), any());
    }

}
