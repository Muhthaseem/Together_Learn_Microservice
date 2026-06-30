package com.togetherlearn.peer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerOfferResponse {
    private String offerId;
    private String tutorId;
    private String courseCode;
    private String description;
    private String status;
    private LocalDateTime createdAt;
}
