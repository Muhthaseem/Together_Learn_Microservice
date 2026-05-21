package com.togetherlearn.peer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerRequestResponse {
    private String requestId;
    private String requesterId;
    private String courseCode;
    private String topic;
    private String title;
    private String description;
    private String preferredMode;
    private String location;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String department;
    private String status;
    private LocalDateTime createdAt;
    private List<ApplicationDto> applications;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationDto {
        private String applicationId;
        private String applicantId;
        private String message;
        private String status;
        private LocalDateTime appliedAt;
    }
}
