package com.togetherlearn.qa.repository;

import com.togetherlearn.qa.entity.AnswerReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnswerReplyRepository extends JpaRepository<AnswerReply, Long> {
    List<AnswerReply> findByAnswerIdOrderByCreatedAtAsc(String answerId);
    Optional<AnswerReply> findByReplyId(String replyId);
}
