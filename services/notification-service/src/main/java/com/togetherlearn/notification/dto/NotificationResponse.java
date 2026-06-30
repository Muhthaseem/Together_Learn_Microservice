package com.togetherlearn.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String notificationId;
    private String type;
    private String title;
    private String message;
    private String referenceType;
    private String referenceId;
    private boolean read;
    private LocalDateTime createdAt;
}
