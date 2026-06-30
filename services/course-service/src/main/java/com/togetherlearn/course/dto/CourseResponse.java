package com.togetherlearn.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private String courseCode;
    private String title;
    private String description;
    private String department;
    private Integer semester;
    private Integer credits;
    private String preReqs;
}
