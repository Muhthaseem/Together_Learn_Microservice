package com.togetherlearn.qa.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateQuestionRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String body;

    private String authorName;
    private String courseCode;
    private String tags;
    private List<String> attachmentUrls = new ArrayList<>();
}
