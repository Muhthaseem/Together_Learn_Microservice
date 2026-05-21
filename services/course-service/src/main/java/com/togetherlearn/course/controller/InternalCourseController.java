package com.togetherlearn.course.controller;

import com.togetherlearn.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/internal/courses")
@RequiredArgsConstructor
public class InternalCourseController {

    private final CourseService courseService;

    // Called by Group, Q&A, Peer services via Feign — blocked at the Gateway from public access
    @GetMapping("/{courseCode}/exists")
    public ResponseEntity<Map<String, Boolean>> courseExists(@PathVariable String courseCode) {
        return ResponseEntity.ok(Map.of("exists", courseService.courseExists(courseCode)));
    }
}
