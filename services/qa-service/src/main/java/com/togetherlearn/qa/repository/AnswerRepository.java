package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByQuestionId(String questionId);
    Optional<Answer> findByAnswerId(String answerId);

    @Modifying
    @Query("UPDATE Answer a SET a.accepted = false WHERE a.questionId = :questionId")
    void clearAcceptedForQuestion(String questionId);

    @Modifying
    @Query("UPDATE Answer a SET a.upvoteCount = a.upvoteCount + :delta WHERE a.answerId = :answerId")
    void adjustUpvoteCount(@org.springframework.data.repository.query.Param("answerId") String answerId,
                           @org.springframework.data.repository.query.Param("delta") int delta);
}
