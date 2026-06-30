package com.togetherlearn.peer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private String sessionId;
    private String requestId;
    private String applicationId;
    private String tutorId;
    private String studentId;
    private LocalDate sessionDate;
    private LocalTime sessionTime;
    private Integer durationMinutes;
    private String mode;
    private String meetingLink;
    private String location;
    private String status;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
