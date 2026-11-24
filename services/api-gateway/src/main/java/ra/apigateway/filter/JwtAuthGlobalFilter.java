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
import java.time.Instant;
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
    private final TokenBlacklistStore blacklistStore;
    public JwtAuthGlobalFilter(@Value("${jwt.secret}") String secret,
                               TokenBlacklistStore blacklistStore) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.blacklistStore = blacklistStore;
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
        if (HttpMethod.POST.equals(method) && path.equals("/api/v1/auth/logout")) {
            Claims optionalClaims = tryParseClaims(request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                var status = exchange.getResponse().getStatusCode();
                if (status != null && status.is2xxSuccessful() && optionalClaims != null && optionalClaims.getExpiration() != null) {
                    blacklistStore.blacklistToken(optionalClaims.getId(), optionalClaims.getExpiration().toInstant());
                }
            }));
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
            String jti = claims.getId();
            String userId = claims.getSubject();
            Instant issuedAt = claims.getIssuedAt() != null ? claims.getIssuedAt().toInstant() : null;

            if (blacklistStore.isRevoked(jti, userId, issuedAt)) {
                return writeJsonError(exchange, HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã đăng xuất hoặc bị thu hồi");
            }

            ServerHttpRequest mutatedReq = request.mutate()
                    .headers(h -> {
                        h.set("X-User-Id", userId);
                        h.set("X-User-Email", String.valueOf(claims.get("email")));
                    })
                    .build();
            ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedReq).build();

            if (HttpMethod.POST.equals(method) && path.equals("/api/v1/auth/logout-all")) {
                return chain.filter(mutatedExchange).then(Mono.fromRunnable(() -> {
                    var status = mutatedExchange.getResponse().getStatusCode();
                    if (status != null && status.is2xxSuccessful()) {
                        if (claims.getExpiration() != null) {
                            blacklistStore.blacklistToken(jti, claims.getExpiration().toInstant());
                        }
                        blacklistStore.blacklistAllForUser(userId);
                    }
                }));
            }
            return chain.filter(mutatedExchange);
        }
        catch (JwtException | IllegalArgumentException e) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED, "JWT token không hợp lệ hoặc đã hết hạn");
        }
    }

    private Claims tryParseClaims(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(authHeader.substring(7).trim())
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean isPublicEndpoint(HttpMethod method, String path) {
        if (path.equals("/api/v1/auth/register")
                || path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/refresh")
                || path.equals("/actuator/health")) {
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
