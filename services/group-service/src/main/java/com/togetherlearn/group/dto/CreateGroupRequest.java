package com.togetherlearn.group.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateGroupRequest {

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String courseCode;

    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String location;

    @NotBlank
    private String mode;   // VIRTUAL | PHYSICAL

    private Integer maxParticipants;
}
