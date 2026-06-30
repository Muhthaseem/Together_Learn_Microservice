package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "tutoring_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutoringSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "request_id", nullable = false)
    private String requestId;

    @Column(name = "application_id", unique = true, nullable = false)
    private String applicationId;

    @Column(name = "tutor_id", nullable = false)
    private String tutorId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_time", nullable = false)
    private LocalTime sessionTime;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 60;

    @Column(nullable = false, length = 10)
    private String mode;  // ONLINE / OFFLINE

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column
    private String location;

    @Column(nullable = false)
    @Builder.Default
    private String status = "SCHEDULED";  // SCHEDULED / COMPLETED / CANCELLED / NO_SHOW

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
