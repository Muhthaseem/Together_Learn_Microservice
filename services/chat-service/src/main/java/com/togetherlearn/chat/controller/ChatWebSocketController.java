package com.togetherlearn.chat.controller;

import com.togetherlearn.chat.dto.CreateMessageRequest;
import com.togetherlearn.chat.dto.MessageResponse;
import com.togetherlearn.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Client sends to /app/chat/{groupId}
     * Server broadcasts to /topic/group/{groupId}
     */
    @MessageMapping("/chat/{groupId}")
    public void handleMessage(@DestinationVariable String groupId,
                               @Payload CreateMessageRequest payload,
                               Principal principal) {
        String authorId = principal.getName();
        log.debug("WS message: group={} author={}", groupId, authorId);
        MessageResponse saved = chatService.postMessage(groupId, payload, authorId);
        messagingTemplate.convertAndSend("/topic/group/" + groupId, saved);
    }
}
