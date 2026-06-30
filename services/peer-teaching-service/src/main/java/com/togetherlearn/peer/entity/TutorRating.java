package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tutor_ratings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rating_id", unique = true, nullable = false)
    private String ratingId;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "tutor_id", nullable = false)
    private String tutorId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(nullable = false)
    private Integer rating;  // 1–5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
