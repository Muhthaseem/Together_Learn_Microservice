package com.togetherlearn.peer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "peer_offers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "offer_id", unique = true, nullable = false)
    private String offerId;

    @Column(name = "tutor_id", nullable = false)
    private String tutorId;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private String status = "AVAILABLE";   // AVAILABLE | BUSY | CLOSED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
