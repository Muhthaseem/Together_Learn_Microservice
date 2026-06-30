package com.togetherlearn.group.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_participants",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private String groupId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    @Builder.Default
    private String role = "MEMBER";   // HOST | MEMBER

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;
}
