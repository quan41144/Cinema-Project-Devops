package ra.ticketservice;

import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;
import ra.ticketservice.dto.IssueTicketRequest;
import ra.ticketservice.dto.ShowtimeLockRequest;
import ra.ticketservice.dto.ShowtimeLockResponse;
import ra.ticketservice.dto.TicketResponse;
import ra.ticketservice.service.INotificationService;
import ra.ticketservice.service.IShowtimeLockService;
import ra.ticketservice.service.ITicketIssuanceService;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ticket_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@RequiredArgsConstructor
class TicketServiceApplicationTests {

    private final ITicketIssuanceService ticketIssuanceService;
    private final IShowtimeLockService showtimeLockService;
    private final INotificationService notificationService;

    @Test
    void contextLoads() {
        Long showtimeId = 10L;

        TicketResponse issued = ticketIssuanceService.issueTicket(new IssueTicketRequest(
                101L, showtimeId, 1L, "Cuoi Xuyen Bien Gioi", "Phong 2",
                LocalDateTime.of(2026, 11, 22, 18, 0), List.of("D5", "D6")));

        assertThat(issued.status()).isEqualTo("ISSUED");
        assertThat(issued.ticketCode()).endsWith("-0101");
        assertThat(issued.seatCodes()).containsExactly("D5", "D6");
        assertThat(notificationService.listNotifications(1L)).hasSize(1);

        // 2. Bật khoá suất chiếu -> xuất vé bị từ chối với HTTP 409 Conflict
        ShowtimeLockResponse locked = showtimeLockService.updateLock(
                showtimeId, new ShowtimeLockRequest(true, "Suất chiếu đã khoá trước giờ chiếu"));
        assertThat(locked.locked()).isTrue();

        IssueTicketRequest rejectedReq = new IssueTicketRequest(
                102L, showtimeId, 1L, "Cuoi Xuyen Bien Gioi", "Phong 2",
                LocalDateTime.of(2026, 11, 22, 18, 0), List.of("D7"));

        assertThatThrownBy(() -> ticketIssuanceService.issueTicket(rejectedReq))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).isEqualTo("Suất chiếu đã khoá trước giờ chiếu");
                });

        // 3. Tắt khoá -> đơn #102 xuất vé thành công bình thường
        showtimeLockService.updateLock(showtimeId, new ShowtimeLockRequest(false, null));
        TicketResponse issuedAfterUnlock = ticketIssuanceService.issueTicket(rejectedReq);
        assertThat(issuedAfterUnlock.status()).isEqualTo("ISSUED");
    }

}
