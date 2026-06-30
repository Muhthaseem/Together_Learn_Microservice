package com.togetherlearn.peer.controller;

import com.togetherlearn.peer.dto.RateSessionRequest;
import com.togetherlearn.peer.dto.SessionResponse;
import com.togetherlearn.peer.dto.TutorStatsResponse;
import com.togetherlearn.peer.service.PeerTeachingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final PeerTeachingService peerService;

    // Must be declared before /{sessionId} so Spring resolves literal paths first
    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> getMySessions(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(peerService.getMySessions(userId));
    }

    @GetMapping("/tutors/{tutorId}/stats")
    public ResponseEntity<TutorStatsResponse> getTutorStats(@PathVariable String tutorId) {
        return ResponseEntity.ok(peerService.getTutorStats(tutorId));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(peerService.getSession(sessionId, userId));
    }

    @PutMapping("/{sessionId}/complete")
    public ResponseEntity<SessionResponse> completeSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(peerService.completeSession(sessionId, userId));
    }

    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<SessionResponse> cancelSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(peerService.cancelSession(sessionId, userId, reason));
    }

    @PostMapping("/{sessionId}/rate")
    public ResponseEntity<SessionResponse> rateSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody RateSessionRequest req) {
        return ResponseEntity.ok(peerService.rateSession(sessionId, userId, req));
    }
}
