package ra.cinemaservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ra.cinemaservice.dto.PriceRuleDto;
import ra.cinemaservice.service.impl.TicketPriceRuleService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prices")
@RequiredArgsConstructor
public class PriceController {
    private final TicketPriceRuleService ticketPriceRuleService;
    @GetMapping
    public List<PriceRuleDto> getPriceRules() {
        return ticketPriceRuleService.listAllPriceRules();
    }
}
