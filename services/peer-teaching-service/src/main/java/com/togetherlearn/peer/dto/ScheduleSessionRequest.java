package com.togetherlearn.peer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleSessionRequest {

    @NotNull
    private LocalDate sessionDate;

    @NotNull
    private LocalTime sessionTime;

    private Integer durationMinutes = 60;

    @NotBlank
    private String mode;  // ONLINE / OFFLINE

    private String meetingLink;
    private String location;
}
