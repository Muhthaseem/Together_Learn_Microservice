package com.togetherlearn.course.repository;

import com.togetherlearn.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    List<Course> findByDepartment(String department);
    List<Course> findByDepartmentAndSemester(String department, Integer semester);
    boolean existsByCourseCode(String courseCode);
}
