package ra.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ra.orderservice.client.dto.CreateNotificationRequest;
import ra.orderservice.client.dto.IssueTicketRequest;
import ra.orderservice.client.dto.TicketResponse;

@FeignClient(name = "ticket-service", url = "${services.ticket-url}")
public interface TicketClient {

    @PostMapping("/api/v1/tickets/issue")
    TicketResponse issueTicket(@RequestBody IssueTicketRequest request);

    @PostMapping("/api/v1/tickets/notifications")
    void createNotification(@RequestBody CreateNotificationRequest request);
}
