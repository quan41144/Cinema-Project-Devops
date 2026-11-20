package ra.cinemaservice.service;

import ra.cinemaservice.dto.PriceRuleDto;

import java.util.List;

public interface ITicketPriceRuleService {
    List<PriceRuleDto> listAllPriceRules();
}
