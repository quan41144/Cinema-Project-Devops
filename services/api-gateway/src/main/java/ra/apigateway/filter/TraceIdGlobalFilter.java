package ra.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class TraceIdGlobalFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(TraceIdGlobalFilter.class);
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String incomingTraceId = exchange.getRequest().getHeaders().getFirst(TRACE_ID_HEADER);
        String traceId = (incomingTraceId != null && !incomingTraceId.isBlank()) ? incomingTraceId : UUID.randomUUID().toString().replace("-", "");

        ServerHttpRequest request = exchange.getRequest()
                .mutate()
                .header(TRACE_ID_HEADER, traceId)
                .build();
        ServerWebExchange muteExchange = exchange.mutate()
                .request(request)
                .build();
        muteExchange.getResponse().getHeaders().add(TRACE_ID_HEADER, traceId);

        String method = request.getMethod().name();
        String path = request.getURI().getRawPath();

        return chain.filter(muteExchange)
                .doFinally(signalType -> {
                    long durationMs = System.currentTimeMillis() - startTime;
                    var statusCode = muteExchange.getResponse().getStatusCode();
                    log.info("[Gateway] traceId={} {} {} -> status={} ({}ms)", traceId, method, path, statusCode != null ? statusCode.value() : "UNKNOWN", durationMs);
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
