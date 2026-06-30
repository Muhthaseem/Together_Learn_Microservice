package com.togetherlearn.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateNotificationRequest {

    @NotBlank
    private String recipientId;

    @NotBlank
    private String type;

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private String referenceType;
    private String referenceId;
}
