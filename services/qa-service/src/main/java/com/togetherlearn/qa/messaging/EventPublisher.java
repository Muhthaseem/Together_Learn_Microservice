package com.togetherlearn.qa.messaging;

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
    static final String ROUTING_KEY = "notification.qa";

    private final RabbitTemplate rabbitTemplate;

    public void publishQuestionAnswered(String recipientId, String questionTitle, String questionId) {
        publish(Map.of(
                "type",          "QUESTION_ANSWERED",
                "recipientId",   recipientId,
                "title",         "Your question received an answer",
                "message",       "Someone answered your question: " + questionTitle,
                "referenceType", "QUESTION",
                "referenceId",   questionId
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
