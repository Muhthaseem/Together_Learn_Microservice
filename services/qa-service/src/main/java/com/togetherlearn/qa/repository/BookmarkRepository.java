package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByUserIdAndQuestionId(String userId, String questionId);
    boolean existsByUserIdAndQuestionId(String userId, String questionId);
    List<Bookmark> findByUserIdOrderByCreatedAtDesc(String userId);
    void deleteByUserIdAndQuestionId(String userId, String questionId);
}
