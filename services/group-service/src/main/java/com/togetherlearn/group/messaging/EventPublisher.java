package com.togetherlearn.group.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    static final String EXCHANGE = "tl.events";
    static final String ROUTING_KEY = "notification.group";

    private final RabbitTemplate rabbitTemplate;

    public void publishGroupJoin(String recipientId, String groupTitle, String groupId) {
        publish(Map.of(
                "type",          "GROUP_JOIN",
                "recipientId",   recipientId,
                "title",         "New member joined your group",
                "message",       "A new student joined your group: " + groupTitle,
                "referenceType", "GROUP",
                "referenceId",   groupId
        ));
    }

    private void publish(Map<String, Object> event) {
        try {
            rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, event);
            log.debug("Published {} event", event.get("type"));
        } catch (Exception e) {
            log.warn("Failed to publish {} event: {}", event.get("type"), e.getMessage());
        }
    }
}
