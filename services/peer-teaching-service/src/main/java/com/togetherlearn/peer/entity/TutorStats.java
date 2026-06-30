package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tutor_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorStats {

    @Id
    @Column(name = "tutor_id")
    private String tutorId;

    @Column(name = "average_rating", nullable = false)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;
}
