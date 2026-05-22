package com.togetherlearn.user.service;

import com.togetherlearn.user.dto.*;
import com.togetherlearn.user.entity.User;
import com.togetherlearn.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .userId(UUID.randomUUID().toString())
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .department(req.getDepartment())
                .batch(req.getBatch())
                .registrationNumber(req.getRegistrationNumber())
                .indexNumber(req.getIndexNumber())
                .role("STUDENT")
                .build();

        userRepository.save(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .batch(user.getBatch())
                .role(user.getRole())
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .batch(user.getBatch())
                .role(user.getRole())
                .token(token)
                .build();
    }

    @Cacheable(value = "users", key = "#userId")
    public UserResponse getUser(String userId) {
        return toResponse(findByUserId(userId));
    }

    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public UserResponse updateUser(String userId, String requesterId, UpdateUserRequest req) {
        if (!userId.equals(requesterId)) {
            throw new SecurityException("Cannot update another user's profile");
        }
        User user = findByUserId(userId);

        if (req.getName() != null) user.setName(req.getName());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        if (req.getBatch() != null) user.setBatch(req.getBatch());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getCourses() != null) user.setCourses(req.getCourses());

        return toResponse(userRepository.save(user));
    }

    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public void changePassword(String userId, ChangePasswordRequest req) {
        User user = findByUserId(userId);
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    // ── Admin operations ─────────────────────────────────────────────────────

    public Page<UserResponse> getAllUsers(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return userRepository.searchByNameOrEmail(q, pageable).map(this::toResponse);
        }
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public UserResponse updateUserRole(String userId, String newRole) {
        if (!Set.of("ADMIN", "STUDENT").contains(newRole)) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }
        User user = findByUserId(userId);
        user.setRole(newRole);
        return toResponse(userRepository.save(user));
    }

    // ── Logout (JWT blacklist) ────────────────────────────────────────────────

    public void logout(String rawToken) {
        try {
            Claims claims = jwtService.parseToken(rawToken);
            String jti = (String) claims.get("jti");
            long remainingMs = claims.getExpiration().getTime() - System.currentTimeMillis();
            if (jti != null && remainingMs > 0) {
                redisTemplate.opsForValue().set("jwt:blacklist:" + jti, "1", Duration.ofMillis(remainingMs));
            }
        } catch (Exception ignored) {
            // Invalid/expired token — nothing to blacklist
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    public InternalUserDto getInternalUser(String userId) {
        User user = findByUserId(userId);
        return InternalUserDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .batch(user.getBatch())
                .build();
    }

    private User findByUserId(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .batch(user.getBatch())
                .avatarUrl(user.getAvatarUrl())
                .registrationNumber(user.getRegistrationNumber())
                .indexNumber(user.getIndexNumber())
                .role(user.getRole())
                .courses(user.getCourses())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
