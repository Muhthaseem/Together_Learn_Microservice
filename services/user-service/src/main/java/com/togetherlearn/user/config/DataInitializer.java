package com.togetherlearn.user.config;

import com.togetherlearn.user.entity.User;
import com.togetherlearn.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail("tl")) {
            User admin = User.builder()
                    .userId(UUID.randomUUID().toString())
                    .name("Admin")
                    .email("tl")
                    .password(passwordEncoder.encode("mytl@M3"))
                    .role("ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created — login: tl / mytl@M3");
        }
    }
}
