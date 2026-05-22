package com.togetherlearn.group.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UpdateGroupRequest {
    private String title;
    private String description;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String location;
    private String mode;
    private Integer maxParticipants;
    private String status;
}
