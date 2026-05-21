package com.togetherlearn.course.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory cf) {
        var jsonSerializer = RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer());

        var defaults = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(jsonSerializer)
                .disableCachingNullValues();

        return RedisCacheManager.builder(cf)
                .cacheDefaults(defaults.entryTtl(Duration.ofHours(1)))
                .withInitialCacheConfigurations(Map.of(
                        "courses",    defaults.entryTtl(Duration.ofHours(24)),
                        "course",     defaults.entryTtl(Duration.ofHours(24))
                ))
                .build();
    }
}
