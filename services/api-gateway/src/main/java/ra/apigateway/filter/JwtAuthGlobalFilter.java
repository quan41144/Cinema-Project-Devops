package ra.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {
    private static final List<String> INTERNAL_ONLY_SUFFIXES = List.of(
            "/wallet/debit",
            "/wallet/refund",
            "/seats/hold",
            "/seats/confirm",
            "/seats/release",
            "/tickets/issue"
    );
    private final SecretKey secretKey;
    public JwtAuthGlobalFilter(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getRawPath();
        HttpMethod method = request.getMethod();

        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }
        boolean isInternalPart = INTERNAL_ONLY_SUFFIXES.stream().anyMatch(path::endsWith);
        if (isInternalPart) {
            return writeJsonError(exchange, HttpStatus.FORBIDDEN,
                    "API nội bộ chỉ cho phép gọi trong mạng riêng giữa các service");
        }
        if (isPublicEndpoint(method, path)) {
            return chain.filter(exchange);
        }
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED, "Thiếu JWT token trong header Authorization");
        }
        String token = authHeader.substring(7).trim();
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            ServerHttpRequest mutatedReq = request.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Email", String.valueOf(claims.get("email")))
                    .build();
            return chain.filter(exchange.mutate().request(mutatedReq).build());
        }
        catch (JwtException | IllegalArgumentException e) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED, "JWT token không hợp lệ hoặc đã hết hạn");
        }
    }
    private boolean isPublicEndpoint(HttpMethod method, String path) {
        if (path.startsWith("/api/v1/auth") || path.equals("/actuator/health")) {
            return true;
        }
        if (HttpMethod.GET.equals(method)) {
            return path.startsWith("/api/v1/movies")
                    || path.startsWith("/api/v1/categories")
                    || path.startsWith("/api/v1/showtimes")
                    || path.startsWith("/api/v1/prices");
        }
        return false;
    }

    private Mono<Void> writeJsonError(ServerWebExchange exchange, HttpStatus status, String message) {
        String traceId = exchange.getResponse().getHeaders().getFirst(TraceIdGlobalFilter.TRACE_ID_HEADER);
        String body = String.format("{\"status\":%d,\"message\":\"%s\",\"traceId\":\"%s\"}",
                status.value(), message, traceId != null ? traceId : "");
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
