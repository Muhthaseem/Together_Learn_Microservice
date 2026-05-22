package com.togetherlearn.qa.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateAnswerRequest {

    @NotBlank
    private String content;

    private List<String> attachmentUrls = new ArrayList<>();
}
