package com.togetherlearn.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserDto {
    private String userId;
    private String name;
    private String email;
    private String department;
    private String batch;
}
