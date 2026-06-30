package com.togetherlearn.peer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePeerRequestDto {

    @NotBlank
    private String courseCode;

    @NotBlank
    private String topic;

    private String title;
    private String description;
    private String preferredMode;   // ONLINE / OFFLINE / BOTH
    private String location;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String department;
}
