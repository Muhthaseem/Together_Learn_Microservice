package com.togetherlearn.notification.controller;

import com.togetherlearn.notification.dto.CreateNotificationRequest;
import com.togetherlearn.notification.dto.NotificationResponse;
import com.togetherlearn.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final NotificationService notificationService;

    // Called by Group, Q&A, Peer services via Feign — blocked at Gateway from public access
    @PostMapping
    public ResponseEntity<NotificationResponse> create(
            @Valid @RequestBody CreateNotificationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(req));
    }
}
