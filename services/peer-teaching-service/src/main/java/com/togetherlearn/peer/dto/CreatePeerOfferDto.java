package com.togetherlearn.peer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePeerOfferDto {

    @NotBlank
    private String courseCode;

    private String description;
}
