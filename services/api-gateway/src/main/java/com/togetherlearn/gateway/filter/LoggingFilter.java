package com.togetherlearn.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");

        return chain.filter(exchange).doFinally(signal -> {
            long duration = System.currentTimeMillis() - start;
            var statusCode = exchange.getResponse().getStatusCode();
            int status = statusCode != null ? statusCode.value() : 0;
            log.info("method={} path={} userId={} status={} duration={}ms",
                    method, path, userId != null ? userId : "anon", status, duration);
        });
    }

    @Override
    public int getOrder() {
        return 1; // runs last among our custom filters so it captures the full response time
    }
}
