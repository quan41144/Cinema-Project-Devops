package ra.ticketservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ra.ticketservice.dto.*;
import ra.ticketservice.service.INotificationService;
import ra.ticketservice.service.IShowtimeLockService;
import ra.ticketservice.service.ITicketIssuanceService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final ITicketIssuanceService ticketIssuanceService;
    private final IShowtimeLockService showtimeLockService;
    private final INotificationService notificationService;

    @PostMapping("/issue")
    public TicketResponse issueTicket(@Valid @RequestBody IssueTicketRequest req) {
        return ticketIssuanceService.issueTicket(req);
    }

    @GetMapping("/by-order/{orderId}")
    public TicketResponse getByOrderId(@PathVariable Long orderId) {
        return ticketIssuanceService.getByOrderId(orderId);
    }

    @GetMapping
    public List<TicketResponse> listByCustomer(@RequestParam Long customerId) {
        return ticketIssuanceService.getByCustomerId(customerId);
    }

    @PutMapping("/locks/{showtimeId}")
    public ShowtimeLockResponse updateLock(@PathVariable Long showtimeId,
                                           @Valid @RequestBody ShowtimeLockRequest req) {
        return showtimeLockService.updateLock(showtimeId, req);
    }

    @GetMapping("/locks/{showtimeId}")
    public ShowtimeLockResponse getLock(@PathVariable Long showtimeId) {
        return showtimeLockService.getLock(showtimeId);
    }

    @GetMapping("/locks")
    public List<ShowtimeLockResponse> listLocks() {
        return showtimeLockService.listLocks();
    }

    @PostMapping("/notifications")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketNotificationDto createNotification(@Valid @RequestBody CreateNotificationRequest req) {
        return notificationService.createNotification(req);
    }

    @GetMapping("/notifications")
    public List<TicketNotificationDto> listNotifications(@RequestParam(required = false) Long customerId) {
        return notificationService.listNotifications(customerId);
    }
}
