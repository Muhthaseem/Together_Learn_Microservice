package com.togetherlearn.qa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {
    private String answerId;
    private String questionId;
    private String content;
    private String authorId;
    private String authorName;
    private boolean accepted;
    private Integer upvoteCount;
    private List<String> attachmentUrls;
    private List<ReplyResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Populated when userId is available
    private String userVote;   // "UP", "DOWN", or null
}
