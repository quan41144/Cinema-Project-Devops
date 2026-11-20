package ra.cinemaservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ra.cinemaservice.dto.PriceRuleDto;
import ra.cinemaservice.repository.TicketPriceRuleRepository;
import ra.cinemaservice.service.ITicketPriceRuleService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketPriceRuleService implements ITicketPriceRuleService {
    private final TicketPriceRuleRepository ticketPriceRuleRepository;
    @Override
    public List<PriceRuleDto> listAllPriceRules() {
        return ticketPriceRuleRepository.findAllByOrderByFormatAscDayTypeAscStartHourAscSeatTypeAsc()
                .stream()
                .map(r -> new PriceRuleDto(
                        r.getId(),
                        r.getFormat(),
                        r.getDayType(),
                        r.getTimeSlot(),
                        r.getStartHour(),
                        r.getEndHour(),
                        r.getSeatType(),
                        r.getBasePrice(),
                        r.getLongMovieSurcharge()
                )).toList();
    }
}
