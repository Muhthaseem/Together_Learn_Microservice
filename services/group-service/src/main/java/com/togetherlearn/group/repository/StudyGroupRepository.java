package com.togetherlearn.group.repository;

import com.togetherlearn.group.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    Optional<StudyGroup> findByGroupId(String groupId);
    List<StudyGroup> findByCourseCode(String courseCode);
    boolean existsByGroupId(String groupId);
}
