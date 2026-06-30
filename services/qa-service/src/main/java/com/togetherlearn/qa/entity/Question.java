package com.togetherlearn.qa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", unique = true, nullable = false)
    private String questionId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "author_id", nullable = false)
    private String authorId;

    @Column(name = "course_code")
    private String courseCode;

    private String tags;

    @Column(nullable = false)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "answer_count")
    @Builder.Default
    private Integer answerCount = 0;

    @Column(name = "upvote_count")
    @Builder.Default
    private Integer upvoteCount = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "question_attachments",
        joinColumns = @JoinColumn(name = "question_id", referencedColumnName = "question_id")
    )
    @Column(name = "attachment_url")
    @Builder.Default
    private List<String> attachmentUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
