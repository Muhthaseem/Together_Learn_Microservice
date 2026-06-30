package com.togetherlearn.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String userId;
    private String name;
    private String email;
    private String department;
    private String batch;
    private String avatarUrl;
    private String registrationNumber;
    private String indexNumber;
    private String role;
    private Set<String> courses;
    private LocalDateTime createdAt;
}
