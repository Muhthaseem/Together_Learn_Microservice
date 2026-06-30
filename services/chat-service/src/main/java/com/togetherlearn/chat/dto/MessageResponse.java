package com.togetherlearn.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String messageId;
    private String groupId;
    private String authorId;
    private String content;
    private String attachmentUrl;
    private LocalDateTime createdAt;
}
