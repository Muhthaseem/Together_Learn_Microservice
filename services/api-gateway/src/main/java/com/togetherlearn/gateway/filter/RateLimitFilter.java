package com.togetherlearn.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.List;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final List<String> AUTH_PATHS = List.of("/api/auth/login", "/api/auth/register");

    // Requests per minute per bucket
    private static final int AUTH_LIMIT = 10;    // per IP  — brute-force protection
    private static final int USER_LIMIT = 300;   // per authenticated userId
    private static final int ANON_LIMIT = 30;    // per IP  — unauthenticated

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        // X-User-Id is set by JwtAuthFilter (order -1) which runs before this filter (order 0)
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        String ip = resolveClientIp(exchange);
        long window = System.currentTimeMillis() / 60_000; // 1-minute fixed window

        boolean isAuthPath = AUTH_PATHS.stream().anyMatch(path::startsWith);

        String key;
        int limit;
        if (isAuthPath) {
            key = "rl:auth:" + ip + ":" + window;
            limit = AUTH_LIMIT;
        } else if (userId != null && !userId.isBlank()) {
            key = "rl:user:" + userId + ":" + window;
            limit = USER_LIMIT;
        } else {
            key = "rl:anon:" + ip + ":" + window;
            limit = ANON_LIMIT;
        }

        final int finalLimit = limit;
        return redisTemplate.opsForValue().increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        // First hit in this window — set TTL so the key expires automatically
                        return redisTemplate.expire(key, Duration.ofSeconds(65))
                                .then(chain.filter(exchange));
                    }
                    if (count > finalLimit) {
                        log.warn("Rate limit exceeded: key={} count={} limit={}", key, count, finalLimit);
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(finalLimit));
                        exchange.getResponse().getHeaders().set("Retry-After", "60");
                        return exchange.getResponse().setComplete();
                    }
                    return chain.filter(exchange);
                });
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        String xff = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote != null ? remote.getAddress().getHostAddress() : "unknown";
    }

    @Override
    public int getOrder() {
        return 0; // after JwtAuthFilter (-1) so X-User-Id header is already set
    }
}
