package com.togetherlearn.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String email;   // also accepts plain username (e.g., admin username "tl")

    @NotBlank
    private String password;
}
