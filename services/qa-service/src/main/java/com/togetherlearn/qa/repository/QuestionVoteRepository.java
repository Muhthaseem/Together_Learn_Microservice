package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.QuestionVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionVoteRepository extends JpaRepository<QuestionVote, Long> {
    Optional<QuestionVote> findByQuestionIdAndUserId(String questionId, String userId);
    void deleteByQuestionIdAndUserId(String questionId, String userId);
}
