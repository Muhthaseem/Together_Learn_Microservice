package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.AnswerVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnswerVoteRepository extends JpaRepository<AnswerVote, Long> {
    Optional<AnswerVote> findByAnswerIdAndUserId(String answerId, String userId);
    void deleteByAnswerIdAndUserId(String answerId, String userId);
}
