package com.togetherlearn.course.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.togetherlearn.course.entity.Course;
import com.togetherlearn.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CourseSeedService implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        if (courseRepository.count() > 0) {
            log.info("Course data already seeded, skipping.");
            return;
        }

        try {
            ClassPathResource resource = new ClassPathResource("data/courses.json");
            InputStream inputStream = resource.getInputStream();

            // The JSON is a map of department -> list of course objects
            Map<String, List<Map<String, Object>>> raw =
                    objectMapper.readValue(inputStream, new TypeReference<>() {});

            int count = 0;
            for (Map.Entry<String, List<Map<String, Object>>> entry : raw.entrySet()) {
                String department = entry.getKey();
                for (Map<String, Object> courseMap : entry.getValue()) {
                    Course course = Course.builder()
                            .courseCode(getString(courseMap, "code", "courseCode"))
                            .title(getString(courseMap, "title", "name"))
                            .description(getString(courseMap, "description", "desc"))
                            .department(department)
                            .semester(getInt(courseMap, "semester", "level"))
                            .credits(getInt(courseMap, "credits", "credit"))
                            .preReqs(getString(courseMap, "prerequisites", "preReqs"))
                            .build();

                    if (course.getCourseCode() != null && !course.getCourseCode().isBlank()) {
                        courseRepository.save(course);
                        count++;
                    }
                }
            }
            log.info("Seeded {} courses from courses.json", count);

        } catch (Exception e) {
            log.error("Failed to seed course data: {}", e.getMessage());
        }
    }

    private String getString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) return val.toString();
        }
        return null;
    }

    private Integer getInt(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val instanceof Number) return ((Number) val).intValue();
            if (val instanceof String s) {
                try { return Integer.parseInt(s); } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }
}
