package ra.cinemaservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ra.cinemaservice.entity.Showtime;
import ra.cinemaservice.entity.TicketPriceRule;
import ra.cinemaservice.repository.TicketPriceRuleRepository;
import ra.cinemaservice.service.IPricingService;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class PricingService implements IPricingService {
    private final TicketPriceRuleRepository ticketPriceRuleRepository;
    @Override
    public BigDecimal calculateSeatPrice(Showtime showtime, String seatType) {
        String dayType = resolveDayType(showtime.getShowDate());
        String timeSlot = resolveTimeSlot(showtime.getStartTime());
        TicketPriceRule rule = ticketPriceRuleRepository
                .findByFormatAndDayTypeAndTimeSlotAndSeatType(showtime.getFormat(), dayType, timeSlot, seatType)
                .orElseThrow(() -> new IllegalStateException("Chưa cấu hình bảng giá cho " + showtime.getFormat() + "/" + dayType + "/" + timeSlot + "/" + seatType));
        BigDecimal price = rule.getBasePrice();
        if (showtime.getMovie().getDurationMinutes() >= 150) {
            price = price.add(rule.getLongMovieSurcharge());
        }
        return price;
    }

    @Override
    public String resolveDayType(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return (dow == DayOfWeek.FRIDAY || dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY)
                ? "WEEKEND_HOLIDAY" : "WEEKDAY";
    }

    @Override
    public String resolveTimeSlot(LocalTime time) {
        if (time.isBefore(LocalTime.of(12, 0))) return "BEFORE_12";
        if (time.isBefore(LocalTime.of(17, 0))) return "12_T0_17";
        if (time.isBefore(LocalTime.of(23, 0))) return "17_T0_23";
        return "AFTER_23";
    }
}
