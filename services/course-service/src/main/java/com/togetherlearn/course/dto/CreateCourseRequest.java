package com.togetherlearn.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCourseRequest {
    @NotBlank private String courseCode;
    @NotBlank private String title;
    private String description;
    @NotBlank private String department;
    @NotNull  private Integer semester;
    private Integer credits;
    private String preReqs;
}
