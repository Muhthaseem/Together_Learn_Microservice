package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "peer_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", unique = true, nullable = false)
    private String applicationId;

    @Column(name = "request_id", nullable = false)
    private String requestId;

    @Column(name = "applicant_id", nullable = false)
    private String applicantId;

    private String message;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";   // PENDING | ACCEPTED | REJECTED

    @CreationTimestamp
    @Column(name = "applied_at", updatable = false)
    private LocalDateTime appliedAt;
}
