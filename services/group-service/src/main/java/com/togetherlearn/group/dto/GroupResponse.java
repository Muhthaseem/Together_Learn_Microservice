package com.togetherlearn.group.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {
    private String groupId;
    private String title;
    private String description;
    private String creatorId;
    private String courseCode;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String location;
    private String mode;
    private String status;
    private Integer maxParticipants;
    private long participantCount;
    private LocalDateTime createdAt;

    // Only populated for detail view
    private List<ParticipantDto> participants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private String userId;
        private String role;
    }
}
