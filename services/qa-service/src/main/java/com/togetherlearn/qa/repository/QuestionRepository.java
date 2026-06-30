package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Optional<Question> findByQuestionId(String questionId);
    List<Question> findByCourseCode(String courseCode);
    List<Question> findByStatus(String status);
    List<Question> findByCourseCodeAndStatus(String courseCode, String status);

    @Modifying
    @Query("UPDATE Question q SET q.answerCount = q.answerCount + 1 WHERE q.questionId = :questionId")
    void incrementAnswerCount(String questionId);

    @Modifying
    @Query("UPDATE Question q SET q.answerCount = q.answerCount - 1 WHERE q.questionId = :questionId AND q.answerCount > 0")
    void decrementAnswerCount(String questionId);

    @Modifying
    @Query("UPDATE Question q SET q.upvoteCount = q.upvoteCount + :delta WHERE q.questionId = :questionId")
    void adjustUpvoteCount(@org.springframework.data.repository.query.Param("questionId") String questionId,
                           @org.springframework.data.repository.query.Param("delta") int delta);
}
