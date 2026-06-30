package com.togetherlearn.peer.service;

import com.togetherlearn.peer.dto.*;
import com.togetherlearn.peer.entity.*;
import com.togetherlearn.peer.messaging.EventPublisher;
import com.togetherlearn.peer.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PeerTeachingService {

    private final PeerRequestRepository requestRepository;
    private final PeerOfferRepository offerRepository;
    private final PeerApplicationRepository applicationRepository;
    private final TutoringSessionRepository sessionRepository;
    private final TutorRatingRepository ratingRepository;
    private final TutorStatsRepository statsRepository;
    private final EventPublisher eventPublisher;

    // ── Peer Requests ─────────────────────────────────────────────────────────

    @Transactional
    public PeerRequestResponse createRequest(CreatePeerRequestDto dto, String requesterId) {
        PeerRequest req = PeerRequest.builder()
                .requestId(UUID.randomUUID().toString())
                .requesterId(requesterId)
                .courseCode(dto.getCourseCode())
                .topic(dto.getTopic())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .preferredMode(dto.getPreferredMode() != null ? dto.getPreferredMode() : "BOTH")
                .location(dto.getLocation())
                .fromDate(dto.getFromDate())
                .toDate(dto.getToDate())
                .department(dto.getDepartment())
                .build();
        return toRequestResponse(requestRepository.save(req), false);
    }

    public List<PeerRequestResponse> listRequests(String courseCode, String department) {
        List<PeerRequest> requests;
        if (courseCode != null && department != null) {
            requests = requestRepository.findByCourseCodeAndDepartmentAndStatus(courseCode, department, "OPEN");
        } else if (courseCode != null) {
            requests = requestRepository.findByCourseCodeAndStatus(courseCode, "OPEN");
        } else if (department != null) {
            requests = requestRepository.findByDepartmentAndStatus(department, "OPEN");
        } else {
            requests = requestRepository.findByStatus("OPEN");
        }
        return requests.stream().map(r -> toRequestResponse(r, false)).collect(Collectors.toList());
    }

    public PeerRequestResponse getRequest(String requestId) {
        return toRequestResponse(findRequest(requestId), true);
    }

    @Transactional
    public PeerRequestResponse updateRequest(String requestId, String requesterId, String status) {
        PeerRequest req = findRequest(requestId);
        if (!req.getRequesterId().equals(requesterId)) {
            throw new SecurityException("Only the requester can update this request");
        }
        req.setStatus(status);
        return toRequestResponse(requestRepository.save(req), false);
    }

    @Transactional
    public PeerRequestResponse.ApplicationDto applyToRequest(String requestId, String applicantId, String message) {
        PeerRequest req = findRequest(requestId);
        if (req.getRequesterId().equals(applicantId)) {
            throw new IllegalArgumentException("Cannot apply to your own request");
        }
        if (!"OPEN".equals(req.getStatus())) {
            throw new IllegalArgumentException("This request is no longer open");
        }
        if (applicationRepository.existsByRequestIdAndApplicantId(requestId, applicantId)) {
            throw new IllegalArgumentException("Already applied to this request");
        }

        PeerApplication app = PeerApplication.builder()
                .applicationId(UUID.randomUUID().toString())
                .requestId(requestId)
                .applicantId(applicantId)
                .message(message)
                .build();
        PeerApplication saved = applicationRepository.save(app);
        eventPublisher.publishPeerApplication(req.getRequesterId(), req.getTopic(), requestId);
        return toApplicationDto(saved);
    }

    @Transactional
    public SessionResponse acceptAndSchedule(String requestId, String applicationId,
                                             String requesterId, ScheduleSessionRequest scheduleReq) {
        PeerRequest req = findRequest(requestId);
        if (!req.getRequesterId().equals(requesterId)) {
            throw new SecurityException("Only the requester can accept an application");
        }

        PeerApplication app = applicationRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
        if (!app.getRequestId().equals(requestId)) {
            throw new IllegalArgumentException("Application does not belong to this request");
        }

        if (sessionRepository.findByApplicationId(applicationId).isPresent()) {
            throw new IllegalArgumentException("A session has already been scheduled for this application");
        }

        app.setStatus("ACCEPTED");
        applicationRepository.save(app);

        applicationRepository.findByRequestId(requestId).stream()
                .filter(a -> "PENDING".equals(a.getStatus()) && !a.getApplicationId().equals(applicationId))
                .forEach(a -> {
                    a.setStatus("REJECTED");
                    applicationRepository.save(a);
                });

        req.setStatus("MATCHED");
        requestRepository.save(req);

        TutoringSession session = TutoringSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .requestId(requestId)
                .applicationId(applicationId)
                .tutorId(app.getApplicantId())
                .studentId(requesterId)
                .sessionDate(scheduleReq.getSessionDate())
                .sessionTime(scheduleReq.getSessionTime())
                .durationMinutes(scheduleReq.getDurationMinutes() != null ? scheduleReq.getDurationMinutes() : 60)
                .mode(scheduleReq.getMode())
                .meetingLink(scheduleReq.getMeetingLink())
                .location(scheduleReq.getLocation())
                .build();
        TutoringSession saved = sessionRepository.save(session);

        eventPublisher.publishPeerAccepted(app.getApplicantId(), req.getTopic(), requestId);
        eventPublisher.publishSessionScheduled(app.getApplicantId(), requesterId, req.getTopic(),
                saved.getSessionDate().toString(), saved.getSessionId());

        return toSessionResponse(saved);
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    public List<SessionResponse> getMySessions(String userId) {
        return sessionRepository.findByParticipant(userId)
                .stream().map(this::toSessionResponse).collect(Collectors.toList());
    }

    public SessionResponse getSession(String sessionId, String userId) {
        TutoringSession session = findSession(sessionId);
        if (!session.getTutorId().equals(userId) && !session.getStudentId().equals(userId)) {
            throw new SecurityException("You are not a participant in this session");
        }
        return toSessionResponse(session);
    }

    @Transactional
    public SessionResponse completeSession(String sessionId, String userId) {
        TutoringSession session = findSession(sessionId);
        if (!session.getTutorId().equals(userId) && !session.getStudentId().equals(userId)) {
            throw new SecurityException("You are not a participant in this session");
        }
        if (!"SCHEDULED".equals(session.getStatus())) {
            throw new IllegalArgumentException("Only SCHEDULED sessions can be marked completed");
        }
        session.setStatus("COMPLETED");
        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse cancelSession(String sessionId, String userId, String reason) {
        TutoringSession session = findSession(sessionId);
        if (!session.getTutorId().equals(userId) && !session.getStudentId().equals(userId)) {
            throw new SecurityException("You are not a participant in this session");
        }
        if (!"SCHEDULED".equals(session.getStatus())) {
            throw new IllegalArgumentException("Only SCHEDULED sessions can be cancelled");
        }
        session.setStatus("CANCELLED");
        session.setCancellationReason(reason);
        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse rateSession(String sessionId, String studentId, RateSessionRequest req) {
        TutoringSession session = findSession(sessionId);
        if (!session.getStudentId().equals(studentId)) {
            throw new SecurityException("Only the student can rate a session");
        }
        if (!"COMPLETED".equals(session.getStatus())) {
            throw new IllegalArgumentException("Only COMPLETED sessions can be rated");
        }
        if (ratingRepository.existsBySessionId(sessionId)) {
            throw new IllegalArgumentException("This session has already been rated");
        }

        TutorRating rating = TutorRating.builder()
                .ratingId(UUID.randomUUID().toString())
                .sessionId(sessionId)
                .tutorId(session.getTutorId())
                .studentId(studentId)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();
        ratingRepository.save(rating);

        updateTutorStats(session.getTutorId(), req.getRating());

        return toSessionResponse(session);
    }

    // ── Tutor Stats ───────────────────────────────────────────────────────────

    public TutorStatsResponse getTutorStats(String tutorId) {
        TutorStats stats = statsRepository.findById(tutorId)
                .orElse(TutorStats.builder().tutorId(tutorId).build());
        return TutorStatsResponse.builder()
                .tutorId(tutorId)
                .averageRating(stats.getAverageRating())
                .ratingCount(stats.getRatingCount())
                .build();
    }

    // ── Peer Offers ───────────────────────────────────────────────────────────

    @Transactional
    public PeerOfferResponse createOffer(CreatePeerOfferDto dto, String tutorId) {
        PeerOffer offer = PeerOffer.builder()
                .offerId(UUID.randomUUID().toString())
                .tutorId(tutorId)
                .courseCode(dto.getCourseCode())
                .description(dto.getDescription())
                .build();
        return toOfferResponse(offerRepository.save(offer));
    }

    public List<PeerOfferResponse> listOffers(String courseCode) {
        List<PeerOffer> offers = courseCode != null
                ? offerRepository.findByCourseCode(courseCode)
                : offerRepository.findByStatus("AVAILABLE");
        return offers.stream().map(this::toOfferResponse).collect(Collectors.toList());
    }

    @Transactional
    public PeerOfferResponse updateOffer(String offerId, String tutorId, String status) {
        PeerOffer offer = offerRepository.findByOfferId(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found: " + offerId));
        if (!offer.getTutorId().equals(tutorId)) {
            throw new SecurityException("Only the offer owner can update it");
        }
        offer.setStatus(status);
        return toOfferResponse(offerRepository.save(offer));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void updateTutorStats(String tutorId, int newRating) {
        TutorStats stats = statsRepository.findById(tutorId)
                .orElse(TutorStats.builder().tutorId(tutorId).build());
        int newCount = stats.getRatingCount() + 1;
        BigDecimal newAvg = stats.getAverageRating()
                .multiply(BigDecimal.valueOf(stats.getRatingCount()))
                .add(BigDecimal.valueOf(newRating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);
        stats.setRatingCount(newCount);
        stats.setAverageRating(newAvg);
        statsRepository.save(stats);
    }

    private PeerRequest findRequest(String requestId) {
        return requestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));
    }

    private TutoringSession findSession(String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    private PeerRequestResponse toRequestResponse(PeerRequest r, boolean includeApplications) {
        List<PeerRequestResponse.ApplicationDto> apps = null;
        if (includeApplications) {
            apps = applicationRepository.findByRequestId(r.getRequestId())
                    .stream().map(this::toApplicationDto).collect(Collectors.toList());
        }
        return PeerRequestResponse.builder()
                .requestId(r.getRequestId())
                .requesterId(r.getRequesterId())
                .courseCode(r.getCourseCode())
                .topic(r.getTopic())
                .title(r.getTitle())
                .description(r.getDescription())
                .preferredMode(r.getPreferredMode())
                .location(r.getLocation())
                .fromDate(r.getFromDate())
                .toDate(r.getToDate())
                .department(r.getDepartment())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .applications(apps)
                .build();
    }

    private PeerRequestResponse.ApplicationDto toApplicationDto(PeerApplication a) {
        return PeerRequestResponse.ApplicationDto.builder()
                .applicationId(a.getApplicationId())
                .applicantId(a.getApplicantId())
                .message(a.getMessage())
                .status(a.getStatus())
                .appliedAt(a.getAppliedAt())
                .build();
    }

    private SessionResponse toSessionResponse(TutoringSession s) {
        return SessionResponse.builder()
                .sessionId(s.getSessionId())
                .requestId(s.getRequestId())
                .applicationId(s.getApplicationId())
                .tutorId(s.getTutorId())
                .studentId(s.getStudentId())
                .sessionDate(s.getSessionDate())
                .sessionTime(s.getSessionTime())
                .durationMinutes(s.getDurationMinutes())
                .mode(s.getMode())
                .meetingLink(s.getMeetingLink())
                .location(s.getLocation())
                .status(s.getStatus())
                .cancellationReason(s.getCancellationReason())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private PeerOfferResponse toOfferResponse(PeerOffer o) {
        return PeerOfferResponse.builder()
                .offerId(o.getOfferId())
                .tutorId(o.getTutorId())
                .courseCode(o.getCourseCode())
                .description(o.getDescription())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
