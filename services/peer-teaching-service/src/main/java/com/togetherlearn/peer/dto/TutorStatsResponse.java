package com.togetherlearn.peer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorStatsResponse {
    private String tutorId;
    private BigDecimal averageRating;
    private Integer ratingCount;
}
