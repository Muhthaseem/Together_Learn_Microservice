package com.togetherlearn.chat.service;

import com.togetherlearn.chat.client.GroupClient;
import com.togetherlearn.chat.dto.CreateMessageRequest;
import com.togetherlearn.chat.dto.MessageResponse;
import com.togetherlearn.chat.entity.ChatMessage;
import com.togetherlearn.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatService {

    private final ChatMessageRepository messageRepository;
    private final GroupClient groupClient;

    public Page<MessageResponse> getMessages(String groupId, int page, int size) {
        validateGroup(groupId);
        return messageRepository
                .findByGroupIdOrderByCreatedAtAsc(groupId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional
    public MessageResponse postMessage(String groupId, CreateMessageRequest req, String authorId) {
        validateGroup(groupId);

        ChatMessage message = ChatMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .groupId(groupId)
                .authorId(authorId)
                .content(req.getContent())
                .attachmentUrl(req.getAttachmentUrl())
                .build();

        ChatMessage saved = messageRepository.save(message);
        return toResponse(saved);
    }

    private void validateGroup(String groupId) {
        Map<String, Boolean> result = groupClient.groupExists(groupId);
        if (!Boolean.TRUE.equals(result.get("exists"))) {
            throw new IllegalArgumentException("Group not found: " + groupId);
        }
    }

    private MessageResponse toResponse(ChatMessage m) {
        return MessageResponse.builder()
                .messageId(m.getMessageId())
                .groupId(m.getGroupId())
                .authorId(m.getAuthorId())
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
