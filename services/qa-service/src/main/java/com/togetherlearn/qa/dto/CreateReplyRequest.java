package com.togetherlearn.qa.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateReplyRequest {
    @NotBlank private String content;
    private String authorName;
}
