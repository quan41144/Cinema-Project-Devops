package ra.ticketservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ra.ticketservice.dto.CreateNotificationRequest;
import ra.ticketservice.dto.TicketNotificationDto;
import ra.ticketservice.entity.TicketNotification;
import ra.ticketservice.repository.TicketNotificationRepository;
import ra.ticketservice.service.INotificationService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService implements INotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final TicketNotificationRepository ticketNotificationRepository;

    @Transactional
    @Override
    public TicketNotificationDto createNotification(CreateNotificationRequest req) {
        TicketNotification entity = new TicketNotification();
        entity.setCustomerId(req.customerId());
        entity.setOrderId(req.orderId());
        entity.setType(req.type().toUpperCase());
        entity.setTitle(req.title());
        entity.setMessage(req.message());

        TicketNotification saved = ticketNotificationRepository.save(entity);
        log.info("[Ticket] Da luu thong bao {} cho customerId={}, orderId={}",
                saved.getType(), saved.getCustomerId(), saved.getOrderId());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public List<TicketNotificationDto> listNotifications(Long customerId) {
        List<TicketNotification> list = (customerId != null)
                ? ticketNotificationRepository.findByCustomerIdOrderBySentAtDesc(customerId)
                : ticketNotificationRepository.findAllByOrderBySentAtDesc();
        return list.stream().map(this::toDto).toList();
    }

    @Override
    public TicketNotificationDto toDto(TicketNotification n) {
        return new TicketNotificationDto(
                n.getId(),
                n.getCustomerId(),
                n.getOrderId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getSentAt()
        );
    }
}
