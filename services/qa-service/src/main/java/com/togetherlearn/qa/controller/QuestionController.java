package com.togetherlearn.qa.controller;

import com.togetherlearn.qa.dto.*;
import com.togetherlearn.qa.service.QaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QaService qaService;

    @GetMapping
    public ResponseEntity<List<QuestionResponse>> listQuestions(
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String status,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(qaService.listQuestions(courseCode, status, userId));
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(
            @Valid @RequestBody CreateQuestionRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(qaService.createQuestion(req, userId));
    }

    // Must be declared before /{questionId} so Spring resolves it as a literal path
    @GetMapping("/bookmarked")
    public ResponseEntity<List<QuestionResponse>> getBookmarked(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(qaService.getBookmarkedQuestions(userId));
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponse> getQuestion(
            @PathVariable String questionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(qaService.getQuestion(questionId, userId));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable String questionId,
            @RequestHeader("X-User-Id") String userId) {
        qaService.deleteQuestion(questionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Answers ───────────────────────────────────────────────────────────────

    @PostMapping("/{questionId}/answers")
    public ResponseEntity<AnswerResponse> addAnswer(
            @PathVariable String questionId,
            @Valid @RequestBody CreateAnswerRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(qaService.addAnswer(questionId, req, userId));
    }

    @PutMapping("/{questionId}/answers/{answerId}")
    public ResponseEntity<AnswerResponse> updateAnswer(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @Valid @RequestBody CreateAnswerRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(qaService.updateAnswer(questionId, answerId, req, userId));
    }

    @DeleteMapping("/{questionId}/answers/{answerId}")
    public ResponseEntity<Void> deleteAnswer(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @RequestHeader("X-User-Id") String userId) {
        qaService.deleteAnswer(questionId, answerId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{questionId}/answers/{answerId}/accept")
    public ResponseEntity<AnswerResponse> acceptAnswer(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(qaService.acceptAnswer(questionId, answerId, userId));
    }

    // ── Votes ─────────────────────────────────────────────────────────────────

    @PostMapping("/{questionId}/vote")
    public ResponseEntity<QuestionResponse> voteQuestion(
            @PathVariable String questionId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        String voteType = body.getOrDefault("type", "UP");
        if (!"UP".equals(voteType) && !"DOWN".equals(voteType)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(qaService.voteQuestion(questionId, userId, voteType));
    }

    @PostMapping("/{questionId}/answers/{answerId}/vote")
    public ResponseEntity<AnswerResponse> voteAnswer(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        String voteType = body.getOrDefault("type", "UP");
        if (!"UP".equals(voteType) && !"DOWN".equals(voteType)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(qaService.voteAnswer(answerId, userId, voteType));
    }

    // ── Bookmarks ─────────────────────────────────────────────────────────────

    @PostMapping("/{questionId}/bookmark")
    public ResponseEntity<Void> bookmark(
            @PathVariable String questionId,
            @RequestHeader("X-User-Id") String userId) {
        qaService.bookmarkQuestion(questionId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{questionId}/bookmark")
    public ResponseEntity<Void> removeBookmark(
            @PathVariable String questionId,
            @RequestHeader("X-User-Id") String userId) {
        qaService.removeBookmark(questionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Replies ───────────────────────────────────────────────────────────────

    @PostMapping("/{questionId}/answers/{answerId}/replies")
    public ResponseEntity<ReplyResponse> addReply(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @Valid @RequestBody CreateReplyRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(qaService.addReply(answerId, req, userId));
    }

    @PutMapping("/{questionId}/answers/{answerId}/replies/{replyId}")
    public ResponseEntity<ReplyResponse> updateReply(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @PathVariable String replyId,
            @Valid @RequestBody CreateReplyRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(qaService.updateReply(replyId, req, userId));
    }

    @DeleteMapping("/{questionId}/answers/{answerId}/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(
            @PathVariable String questionId,
            @PathVariable String answerId,
            @PathVariable String replyId,
            @RequestHeader("X-User-Id") String userId) {
        qaService.deleteReply(replyId, userId);
        return ResponseEntity.noContent().build();
    }
}
