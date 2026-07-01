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
public class QuestionResponse {
    private String questionId;
    private String title;
    private String body;
    private String authorId;
    private String authorName;
    private String courseCode;
    private String tags;
    private String status;
    private Integer answerCount;
    private Integer upvoteCount;
    private List<String> attachmentUrls;
    private LocalDateTime createdAt;

    // Populated on detail view only (requires authenticated userId)
    private List<AnswerResponse> answers;
    private String userVote;      // "UP", "DOWN", or null
    private Boolean bookmarked;
}
