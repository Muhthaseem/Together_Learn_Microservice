package com.togetherlearn.qa.service;

import com.togetherlearn.qa.dto.*;
import com.togetherlearn.qa.entity.*;
import com.togetherlearn.qa.messaging.EventPublisher;
import com.togetherlearn.qa.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class QaService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final QuestionVoteRepository questionVoteRepository;
    private final AnswerVoteRepository answerVoteRepository;
    private final BookmarkRepository bookmarkRepository;
    private final AnswerReplyRepository answerReplyRepository;
    private final EventPublisher eventPublisher;

    // ── Questions ─────────────────────────────────────────────────────────────

    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest req, String authorId) {
        Question q = Question.builder()
                .questionId(UUID.randomUUID().toString())
                .title(req.getTitle())
                .body(req.getBody())
                .authorId(authorId)
                .authorName(req.getAuthorName())
                .courseCode(req.getCourseCode())
                .tags(req.getTags())
                .attachmentUrls(req.getAttachmentUrls() != null ? req.getAttachmentUrls() : new java.util.ArrayList<>())
                .build();
        return toResponse(questionRepository.save(q), null, false);
    }

    public List<QuestionResponse> listQuestions(String courseCode, String status, String userId) {
        List<Question> questions;
        if (courseCode != null && status != null) {
            questions = questionRepository.findByCourseCodeAndStatus(courseCode, status);
        } else if (courseCode != null) {
            questions = questionRepository.findByCourseCode(courseCode);
        } else if (status != null) {
            questions = questionRepository.findByStatus(status);
        } else {
            questions = questionRepository.findAll();
        }
        return questions.stream().map(q -> toResponse(q, userId, false)).collect(Collectors.toList());
    }

    public QuestionResponse getQuestion(String questionId, String userId) {
        return toResponse(findQuestion(questionId), userId, true);
    }

    @Transactional
    public void deleteQuestion(String questionId, String requesterId) {
        Question q = findQuestion(questionId);
        if (!q.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the question author can delete it");
        }
        answerRepository.findByQuestionId(questionId).forEach(answerRepository::delete);
        questionRepository.delete(q);
    }

    // ── Answers ───────────────────────────────────────────────────────────────

    @Transactional
    public AnswerResponse addAnswer(String questionId, CreateAnswerRequest req, String authorId) {
        Question q = findQuestion(questionId);
        Answer answer = Answer.builder()
                .answerId(UUID.randomUUID().toString())
                .questionId(questionId)
                .content(req.getContent())
                .authorId(authorId)
                .authorName(req.getAuthorName())
                .attachmentUrls(req.getAttachmentUrls() != null ? req.getAttachmentUrls() : new java.util.ArrayList<>())
                .build();
        Answer saved = answerRepository.save(answer);
        questionRepository.incrementAnswerCount(questionId);
        if (!authorId.equals(q.getAuthorId())) {
            eventPublisher.publishQuestionAnswered(q.getAuthorId(), q.getTitle(), questionId);
        }
        return toAnswerResponse(saved, null, false);
    }

    @Transactional
    public AnswerResponse updateAnswer(String questionId, String answerId, CreateAnswerRequest req, String requesterId) {
        findQuestion(questionId);
        Answer answer = findAnswer(answerId);
        if (!answer.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the answer author can edit it");
        }
        answer.setContent(req.getContent());
        return toAnswerResponse(answerRepository.save(answer), null, false);
    }

    @Transactional
    public void deleteAnswer(String questionId, String answerId, String requesterId) {
        findQuestion(questionId);
        Answer answer = findAnswer(answerId);
        if (!answer.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the answer author can delete it");
        }
        answerRepository.delete(answer);
        questionRepository.decrementAnswerCount(questionId);
    }

    @Transactional
    public AnswerResponse acceptAnswer(String questionId, String answerId, String requesterId) {
        Question q = findQuestion(questionId);
        if (!q.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the question author can accept an answer");
        }
        answerRepository.clearAcceptedForQuestion(questionId);
        Answer answer = findAnswer(answerId);
        answer.setAccepted(true);
        Answer saved = answerRepository.save(answer);
        q.setStatus("ANSWERED");
        questionRepository.save(q);
        return toAnswerResponse(saved, null, false);
    }

    // ── Votes ─────────────────────────────────────────────────────────────────

    @Transactional
    public QuestionResponse voteQuestion(String questionId, String userId, String voteType) {
        Optional<QuestionVote> existing = questionVoteRepository.findByQuestionIdAndUserId(questionId, userId);
        if (existing.isPresent()) {
            QuestionVote vote = existing.get();
            if (vote.getVoteType().equals(voteType)) {
                questionVoteRepository.delete(vote);
                questionRepository.adjustUpvoteCount(questionId, "UP".equals(voteType) ? -1 : 1);
            } else {
                questionRepository.adjustUpvoteCount(questionId, "UP".equals(voteType) ? 1 : -1);
                vote.setVoteType(voteType);
                questionVoteRepository.save(vote);
            }
        } else {
            questionVoteRepository.save(QuestionVote.builder()
                    .questionId(questionId).userId(userId).voteType(voteType).build());
            questionRepository.adjustUpvoteCount(questionId, "UP".equals(voteType) ? 1 : -1);
        }
        return toResponse(findQuestion(questionId), userId, false);
    }

    @Transactional
    public AnswerResponse voteAnswer(String answerId, String userId, String voteType) {
        Optional<AnswerVote> existing = answerVoteRepository.findByAnswerIdAndUserId(answerId, userId);
        if (existing.isPresent()) {
            AnswerVote vote = existing.get();
            if (vote.getVoteType().equals(voteType)) {
                answerVoteRepository.delete(vote);
                answerRepository.adjustUpvoteCount(answerId, "UP".equals(voteType) ? -1 : 1);
            } else {
                answerRepository.adjustUpvoteCount(answerId, "UP".equals(voteType) ? 1 : -1);
                vote.setVoteType(voteType);
                answerVoteRepository.save(vote);
            }
        } else {
            answerVoteRepository.save(AnswerVote.builder()
                    .answerId(answerId).userId(userId).voteType(voteType).build());
            answerRepository.adjustUpvoteCount(answerId, "UP".equals(voteType) ? 1 : -1);
        }
        return toAnswerResponse(findAnswer(answerId), userId, false);
    }

    // ── Bookmarks ─────────────────────────────────────────────────────────────

    @Transactional
    public void bookmarkQuestion(String questionId, String userId) {
        findQuestion(questionId);
        if (!bookmarkRepository.existsByUserIdAndQuestionId(userId, questionId)) {
            bookmarkRepository.save(Bookmark.builder().userId(userId).questionId(questionId).build());
        }
    }

    @Transactional
    public void removeBookmark(String questionId, String userId) {
        bookmarkRepository.deleteByUserIdAndQuestionId(userId, questionId);
    }

    public List<QuestionResponse> getBookmarkedQuestions(String userId) {
        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(b -> questionRepository.findByQuestionId(b.getQuestionId()))
                .filter(Optional::isPresent)
                .map(opt -> toResponse(opt.get(), userId, false))
                .collect(Collectors.toList());
    }

    // ── Replies ───────────────────────────────────────────────────────────────

    @Transactional
    public ReplyResponse addReply(String answerId, CreateReplyRequest req, String authorId) {
        findAnswer(answerId);
        AnswerReply reply = AnswerReply.builder()
                .replyId(UUID.randomUUID().toString())
                .answerId(answerId)
                .authorId(authorId)
                .authorName(req.getAuthorName())
                .content(req.getContent())
                .build();
        return toReplyResponse(answerReplyRepository.save(reply));
    }

    @Transactional
    public ReplyResponse updateReply(String replyId, CreateReplyRequest req, String requesterId) {
        AnswerReply reply = findReply(replyId);
        if (!reply.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the reply author can edit it");
        }
        reply.setContent(req.getContent());
        return toReplyResponse(answerReplyRepository.save(reply));
    }

    @Transactional
    public void deleteReply(String replyId, String requesterId) {
        AnswerReply reply = findReply(replyId);
        if (!reply.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Only the reply author can delete it");
        }
        answerReplyRepository.delete(reply);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Question findQuestion(String questionId) {
        return questionRepository.findByQuestionId(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));
    }

    private Answer findAnswer(String answerId) {
        return answerRepository.findByAnswerId(answerId)
                .orElseThrow(() -> new IllegalArgumentException("Answer not found: " + answerId));
    }

    private AnswerReply findReply(String replyId) {
        return answerReplyRepository.findByReplyId(replyId)
                .orElseThrow(() -> new IllegalArgumentException("Reply not found: " + replyId));
    }

    private QuestionResponse toResponse(Question q, String userId, boolean includeAnswers) {
        List<AnswerResponse> answers = null;
        if (includeAnswers) {
            answers = answerRepository.findByQuestionId(q.getQuestionId())
                    .stream().map(a -> toAnswerResponse(a, userId, true)).collect(Collectors.toList());
        }
        String userVote = null;
        Boolean bookmarked = null;
        if (userId != null) {
            userVote = questionVoteRepository.findByQuestionIdAndUserId(q.getQuestionId(), userId)
                    .map(QuestionVote::getVoteType).orElse(null);
            bookmarked = bookmarkRepository.existsByUserIdAndQuestionId(userId, q.getQuestionId());
        }
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .title(q.getTitle())
                .body(q.getBody())
                .authorId(q.getAuthorId())
                .authorName(q.getAuthorName())
                .courseCode(q.getCourseCode())
                .tags(q.getTags())
                .status(q.getStatus())
                .answerCount(q.getAnswerCount())
                .upvoteCount(q.getUpvoteCount())
                .attachmentUrls(q.getAttachmentUrls())
                .createdAt(q.getCreatedAt())
                .answers(answers)
                .userVote(userVote)
                .bookmarked(bookmarked)
                .build();
    }

    private AnswerResponse toAnswerResponse(Answer a, String userId, boolean includeReplies) {
        List<ReplyResponse> replies = null;
        if (includeReplies) {
            replies = answerReplyRepository.findByAnswerIdOrderByCreatedAtAsc(a.getAnswerId())
                    .stream().map(this::toReplyResponse).collect(Collectors.toList());
        }
        String userVote = null;
        if (userId != null) {
            userVote = answerVoteRepository.findByAnswerIdAndUserId(a.getAnswerId(), userId)
                    .map(AnswerVote::getVoteType).orElse(null);
        }
        return AnswerResponse.builder()
                .answerId(a.getAnswerId())
                .questionId(a.getQuestionId())
                .content(a.getContent())
                .authorId(a.getAuthorId())
                .authorName(a.getAuthorName())
                .accepted(a.isAccepted())
                .upvoteCount(a.getUpvoteCount())
                .attachmentUrls(a.getAttachmentUrls())
                .replies(replies)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .userVote(userVote)
                .build();
    }

    private ReplyResponse toReplyResponse(AnswerReply r) {
        return ReplyResponse.builder()
                .replyId(r.getReplyId())
                .answerId(r.getAnswerId())
                .authorId(r.getAuthorId())
                .authorName(r.getAuthorName())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
