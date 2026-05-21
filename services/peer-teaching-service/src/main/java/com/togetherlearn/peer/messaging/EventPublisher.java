package com.togetherlearn.peer.messaging;

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
    static final String ROUTING_KEY = "notification.peer";

    private final RabbitTemplate rabbitTemplate;

    public void publishPeerApplication(String recipientId, String requestTopic, String requestId) {
        publish(Map.of(
                "type",          "PEER_APPLICATION",
                "recipientId",   recipientId,
                "title",         "Someone applied to help you",
                "message",       "A student applied to help with your request: " + requestTopic,
                "referenceType", "PEER_REQUEST",
                "referenceId",   requestId
        ));
    }

    public void publishPeerAccepted(String recipientId, String requestTopic, String requestId) {
        publish(Map.of(
                "type",          "PEER_ACCEPTED",
                "recipientId",   recipientId,
                "title",         "Your application was accepted",
                "message",       "Your offer to help was accepted for: " + requestTopic,
                "referenceType", "PEER_REQUEST",
                "referenceId",   requestId
        ));
    }

    public void publishSessionScheduled(String tutorId, String studentId,
                                        String requestTopic, String sessionDate, String sessionId) {
        publish(Map.of(
                "type",          "SESSION_SCHEDULED",
                "recipientId",   tutorId,
                "title",         "Session scheduled",
                "message",       "A tutoring session for \"" + requestTopic + "\" is scheduled on " + sessionDate,
                "referenceType", "SESSION",
                "referenceId",   sessionId
        ));
        publish(Map.of(
                "type",          "SESSION_SCHEDULED",
                "recipientId",   studentId,
                "title",         "Session confirmed",
                "message",       "Your tutoring session for \"" + requestTopic + "\" is confirmed on " + sessionDate,
                "referenceType", "SESSION",
                "referenceId",   sessionId
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
