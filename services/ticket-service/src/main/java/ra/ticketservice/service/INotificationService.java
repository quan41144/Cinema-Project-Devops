package ra.ticketservice.service;

import ra.ticketservice.dto.CreateNotificationRequest;
import ra.ticketservice.dto.TicketNotificationDto;
import ra.ticketservice.entity.TicketNotification;

import java.util.List;

public interface INotificationService {
    TicketNotificationDto createNotification(CreateNotificationRequest req);
    List<TicketNotificationDto> listNotifications(Long customerId);
    TicketNotificationDto toDto(TicketNotification n);
}
