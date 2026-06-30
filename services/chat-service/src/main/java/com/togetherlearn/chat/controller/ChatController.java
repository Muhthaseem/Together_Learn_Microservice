package com.togetherlearn.chat.controller;

import com.togetherlearn.chat.dto.CreateMessageRequest;
import com.togetherlearn.chat.dto.MessageResponse;
import com.togetherlearn.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages/groups")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{groupId}")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable String groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessages(groupId, page, size));
    }

    @PostMapping("/{groupId}")
    public ResponseEntity<MessageResponse> postMessage(
            @PathVariable String groupId,
            @Valid @RequestBody CreateMessageRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.postMessage(groupId, req, userId));
    }
}
