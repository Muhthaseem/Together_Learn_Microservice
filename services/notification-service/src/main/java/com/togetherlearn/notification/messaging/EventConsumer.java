package com.togetherlearn.notification.messaging;

import com.togetherlearn.notification.config.RabbitConfig;
import com.togetherlearn.notification.dto.CreateNotificationRequest;
import com.togetherlearn.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventConsumer {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void handle(Map<String, Object> event) {
        String type = (String) event.get("type");
        log.info("Received notification event: type={}, recipient={}", type, event.get("recipientId"));
        try {
            CreateNotificationRequest req = new CreateNotificationRequest();
            req.setRecipientId((String) event.get("recipientId"));
            req.setType(type);
            req.setTitle((String) event.get("title"));
            req.setMessage((String) event.get("message"));
            req.setReferenceType((String) event.get("referenceType"));
            req.setReferenceId((String) event.get("referenceId"));
            notificationService.create(req);
        } catch (Exception e) {
            log.error("Failed to process notification event type={}: {}", type, e.getMessage(), e);
            throw e; // rethrow so Spring AMQP retries and eventually routes to DLQ
        }
    }
}
