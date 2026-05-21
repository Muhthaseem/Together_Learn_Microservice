package com.togetherlearn.course.service;

import com.togetherlearn.course.dto.CourseResponse;
import com.togetherlearn.course.dto.CreateCourseRequest;
import com.togetherlearn.course.entity.Course;
import com.togetherlearn.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CourseService {

    private final CourseRepository courseRepository;

    @Cacheable(value = "courses", key = "(#department ?: 'ALL') + ':' + (#semester ?: 'ALL')")
    public List<CourseResponse> getAllCourses(String department, Integer semester) {
        List<Course> courses;
        if (department != null && semester != null) {
            courses = courseRepository.findByDepartmentAndSemester(department, semester);
        } else if (department != null) {
            courses = courseRepository.findByDepartment(department);
        } else {
            courses = courseRepository.findAll();
        }
        return courses.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Cacheable(value = "course", key = "#courseCode")
    public CourseResponse getCourse(String courseCode) {
        Course course = courseRepository.findByCourseCode(courseCode)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseCode));
        return toResponse(course);
    }

    public boolean courseExists(String courseCode) {
        return courseRepository.existsByCourseCode(courseCode);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "courses", allEntries = true),
        @CacheEvict(value = "course", key = "#req.courseCode")
    })
    public CourseResponse createCourse(CreateCourseRequest req) {
        if (courseRepository.existsByCourseCode(req.getCourseCode())) {
            throw new IllegalArgumentException("Course code already exists: " + req.getCourseCode());
        }
        Course course = Course.builder()
                .courseCode(req.getCourseCode())
                .title(req.getTitle())
                .description(req.getDescription())
                .department(req.getDepartment())
                .semester(req.getSemester())
                .credits(req.getCredits())
                .preReqs(req.getPreReqs())
                .build();
        return toResponse(courseRepository.save(course));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "courses", allEntries = true),
        @CacheEvict(value = "course", key = "#courseCode")
    })
    public void deleteCourse(String courseCode) {
        Course course = courseRepository.findByCourseCode(courseCode)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseCode));
        courseRepository.delete(course);
    }

    private CourseResponse toResponse(Course c) {
        return CourseResponse.builder()
                .courseCode(c.getCourseCode())
                .title(c.getTitle())
                .description(c.getDescription())
                .department(c.getDepartment())
                .semester(c.getSemester())
                .credits(c.getCredits())
                .preReqs(c.getPreReqs())
                .build();
    }
}
