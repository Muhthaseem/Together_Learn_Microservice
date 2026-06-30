package com.togetherlearn.group.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "study_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", unique = true, nullable = false)
    private String groupId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "creator_id", nullable = false)
    private String creatorId;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    private String location;

    @Column(nullable = false)
    private String mode;   // VIRTUAL | PHYSICAL

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE";   // ACTIVE | CLOSED

    @Column(name = "max_participants")
    @Builder.Default
    private Integer maxParticipants = 20;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
