package com.togetherlearn.notification.service;

import com.togetherlearn.notification.dto.CreateNotificationRequest;
import com.togetherlearn.notification.dto.NotificationResponse;
import com.togetherlearn.notification.entity.Notification;
import com.togetherlearn.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    @CacheEvict(value = "unread-counts", key = "#req.recipientId")
    public NotificationResponse create(CreateNotificationRequest req) {
        Notification n = Notification.builder()
                .notificationId(UUID.randomUUID().toString())
                .recipientId(req.getRecipientId())
                .type(req.getType())
                .title(req.getTitle())
                .message(req.getMessage())
                .referenceType(req.getReferenceType())
                .referenceId(req.getReferenceId())
                .build();
        Notification saved = notificationRepository.save(n);
        return toResponse(saved);
    }

    public Page<NotificationResponse> getForUser(String userId, int page, int size) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Cacheable(value = "unread-counts", key = "#userId")
    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    @CacheEvict(value = "unread-counts", key = "#userId")
    public void markOneRead(String notificationId, String userId) {
        int updated = notificationRepository.markOneAsRead(notificationId, userId);
        if (updated == 0) {
            throw new IllegalArgumentException("Notification not found or not yours");
        }
    }

    @Transactional
    @CacheEvict(value = "unread-counts", key = "#userId")
    public void markAllRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
