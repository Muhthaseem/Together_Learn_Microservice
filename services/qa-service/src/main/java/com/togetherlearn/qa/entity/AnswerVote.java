package com.togetherlearn.qa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "answer_votes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "answer_id", nullable = false)
    private String answerId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "vote_type", nullable = false)
    private String voteType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
