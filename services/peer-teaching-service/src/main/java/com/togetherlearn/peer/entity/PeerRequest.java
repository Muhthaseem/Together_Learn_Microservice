package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "peer_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", unique = true, nullable = false)
    private String requestId;

    @Column(name = "requester_id", nullable = false)
    private String requesterId;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String title;

    @Column(name = "preferred_mode", length = 10)
    @Builder.Default
    private String preferredMode = "BOTH";  // ONLINE / OFFLINE / BOTH

    @Column
    private String location;

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    @Column
    private String department;

    @Column(nullable = false)
    @Builder.Default
    private String status = "OPEN";   // OPEN | MATCHED | CLOSED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
