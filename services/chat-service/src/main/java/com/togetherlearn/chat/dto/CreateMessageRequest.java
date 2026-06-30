package com.togetherlearn.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMessageRequest {

    @NotBlank
    private String content;

    private String attachmentUrl;
}
