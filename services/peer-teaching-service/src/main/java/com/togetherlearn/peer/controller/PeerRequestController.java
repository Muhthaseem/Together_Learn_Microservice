package com.togetherlearn.peer.controller;

import com.togetherlearn.peer.dto.*;
import com.togetherlearn.peer.service.PeerTeachingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/peer-requests")
@RequiredArgsConstructor
public class PeerRequestController {

    private final PeerTeachingService peerService;

    @GetMapping
    public ResponseEntity<List<PeerRequestResponse>> listRequests(
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(peerService.listRequests(courseCode, department));
    }

    @PostMapping
    public ResponseEntity<PeerRequestResponse> createRequest(
            @Valid @RequestBody CreatePeerRequestDto dto,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(peerService.createRequest(dto, userId));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<PeerRequestResponse> getRequest(@PathVariable String requestId) {
        return ResponseEntity.ok(peerService.getRequest(requestId));
    }

    @PutMapping("/{requestId}")
    public ResponseEntity<PeerRequestResponse> updateRequest(
            @PathVariable String requestId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(peerService.updateRequest(requestId, userId, body.get("status")));
    }

    @PostMapping("/{requestId}/apply")
    public ResponseEntity<PeerRequestResponse.ApplicationDto> apply(
            @PathVariable String requestId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String message = body != null ? body.get("message") : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(peerService.applyToRequest(requestId, userId, message));
    }

    @PutMapping("/{requestId}/applications/{applicationId}/accept")
    public ResponseEntity<SessionResponse> acceptApplication(
            @PathVariable String requestId,
            @PathVariable String applicationId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ScheduleSessionRequest scheduleReq) {
        return ResponseEntity.ok(peerService.acceptAndSchedule(requestId, applicationId, userId, scheduleReq));
    }
}
