package ra.ticketservice.service;

import ra.ticketservice.dto.IssueTicketRequest;
import ra.ticketservice.dto.TicketResponse;
import ra.ticketservice.entity.Ticket;

import java.util.List;

public interface ITicketIssuanceService {
    TicketResponse issueTicket(IssueTicketRequest req);
    TicketResponse getByOrderId(Long orderId);
    List<TicketResponse> getByCustomerId(Long customerId);
    TicketResponse toResponse(Ticket t);
}
