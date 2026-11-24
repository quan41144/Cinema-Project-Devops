package ra.orderservice.config;

import feign.RequestInterceptor;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignTraceConfig {
    @Bean
    public RequestInterceptor traceIdFeignInterceptor() {
        return template -> {
            String traceId = MDC.get("trace.id");
            if (traceId != null && !traceId.isBlank()) {
                template.header(TraceIdFilter.TRACE_HEADER, traceId);
            }
        };
    }
}
