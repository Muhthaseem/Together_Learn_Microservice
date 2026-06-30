package com.togetherlearn.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login"
    );

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // WebSocket upgrade requests cannot carry custom headers in browsers;
        // accept JWT via ?token= query param for /ws/ routes as a fallback.
        String token;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (path.startsWith("/ws/") || path.equals("/ws")) {
            token = exchange.getRequest().getQueryParams().getFirst("token");
            if (token == null || token.isBlank()) {
                return unauthorizedResponse(exchange);
            }
        } else {
            return unauthorizedResponse(exchange);
        }

        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return unauthorizedResponse(exchange);
        }

        String jti = claims.get("jti", String.class);

        Mono<Boolean> blacklistCheck = (jti != null)
                ? redisTemplate.hasKey("jwt:blacklist:" + jti)
                : Mono.just(false);

        return blacklistCheck.flatMap(isBlacklisted -> {
            if (Boolean.TRUE.equals(isBlacklisted)) {
                return unauthorizedResponse(exchange);
            }
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Email", getClaimSafely(claims, "email"))
                    .header("X-User-Department", getClaimSafely(claims, "department"))
                    .header("X-User-Batch", getClaimSafely(claims, "batch"))
                    .header("X-User-Role", getClaimSafely(claims, "role"))
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        });
    }

    private String getClaimSafely(Claims claims, String key) {
        Object value = claims.get(key);
        return value != null ? value.toString() : "";
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
