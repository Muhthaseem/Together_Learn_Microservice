package com.togetherlearn.course.controller;

import com.togetherlearn.course.dto.CourseResponse;
import com.togetherlearn.course.dto.CreateCourseRequest;
import com.togetherlearn.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok(courseService.getAllCourses(department, semester));
    }

    @GetMapping("/{courseCode}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable String courseCode) {
        return ResponseEntity.ok(courseService.getCourse(courseCode));
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "STUDENT") String role,
            @Valid @RequestBody CreateCourseRequest req) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(req));
    }

    @DeleteMapping("/{courseCode}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable String courseCode,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "STUDENT") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        courseService.deleteCourse(courseCode);
        return ResponseEntity.noContent().build();
    }
}
