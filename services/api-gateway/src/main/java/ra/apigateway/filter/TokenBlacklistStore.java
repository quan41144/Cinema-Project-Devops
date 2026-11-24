package ra.apigateway.filter;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenBlacklistStore {
    private final Map<String, Instant> revokedTokenIds = new ConcurrentHashMap<>();
    private final Map<String, Instant> userLogoutAllTimestamps = new ConcurrentHashMap<>();
    public void blacklistToken(String jti, Instant expiredAt) {
        if (jti == null || jti.isBlank() || expiredAt == null) {
            return;
        }
        cleanupExpired();
        revokedTokenIds.put(jti, expiredAt);
    }
    public void blacklistAllForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        userLogoutAllTimestamps.put(userId, Instant.now());
    }

    public boolean isRevoked(String jti, String userId, Instant issuedAt) {
        Instant now = Instant.now();

        if (jti != null) {
            Instant exp = revokedTokenIds.get(jti);
            if (exp != null) {
                if (exp.isAfter(now)) {
                    return true;
                }
                revokedTokenIds.remove(jti);
            }
        }

        if (userId != null && issuedAt != null) {
            Instant logoutAllTime = userLogoutAllTimestamps.get(userId);
            if (logoutAllTime != null && issuedAt.isBefore(logoutAllTime.minusSeconds(1))) {
                return true;
            }
        }
        return false;
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        revokedTokenIds.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
