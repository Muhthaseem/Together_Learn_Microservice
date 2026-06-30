package com.togetherlearn.user.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRequest {
    private String name;
    private String department;
    private String batch;
    private String avatarUrl;
    private Set<String> courses;
}
