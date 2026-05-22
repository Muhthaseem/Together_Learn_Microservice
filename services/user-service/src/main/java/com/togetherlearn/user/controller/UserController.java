package com.togetherlearn.user.controller;

import com.togetherlearn.user.dto.UpdateUserRequest;
import com.togetherlearn.user.dto.UserResponse;
import com.togetherlearn.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // List all (admin) or search (any authenticated user with ?q=)
    @GetMapping
    public ResponseEntity<Page<UserResponse>> listUsers(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "STUDENT") String role,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if ("ADMIN".equals(role) || (q != null && !q.isBlank())) {
            return ResponseEntity.ok(userService.getAllUsers(q, PageRequest.of(page, size)));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @RequestHeader("X-User-Id") String requesterId,
            @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(userId, requesterId, req));
    }

    @GetMapping("/{userId}/courses")
    public ResponseEntity<Set<String>> getCourses(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId).getCourses());
    }

    @PutMapping("/{userId}/courses")
    public ResponseEntity<UserResponse> updateCourses(
            @PathVariable String userId,
            @RequestHeader("X-User-Id") String requesterId,
            @RequestBody Set<String> courses) {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setCourses(courses);
        return ResponseEntity.ok(userService.updateUser(userId, requesterId, req));
    }

    // Admin-only: change a user's role
    @PutMapping("/{userId}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable String userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "STUDENT") String requesterRole,
            @RequestBody Map<String, String> body) {
        if (!"ADMIN".equals(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.updateUserRole(userId, body.get("role")));
    }
}
