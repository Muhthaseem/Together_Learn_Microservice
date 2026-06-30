package com.togetherlearn.chat.repository;

import com.togetherlearn.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByGroupIdOrderByCreatedAtAsc(String groupId, Pageable pageable);
}
