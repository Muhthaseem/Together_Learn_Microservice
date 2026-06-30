package com.togetherlearn.user.controller;

import com.togetherlearn.user.dto.InternalUserDto;
import com.togetherlearn.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    // Called by other microservices via Feign — blocked at the Gateway from public access
    @GetMapping("/{userId}")
    public ResponseEntity<InternalUserDto> getInternalUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getInternalUser(userId));
    }
}
