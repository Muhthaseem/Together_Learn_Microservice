package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.TutoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TutoringSessionRepository extends JpaRepository<TutoringSession, Long> {

    Optional<TutoringSession> findBySessionId(String sessionId);

    Optional<TutoringSession> findByApplicationId(String applicationId);

    @Query("SELECT s FROM TutoringSession s WHERE s.tutorId = :userId OR s.studentId = :userId ORDER BY s.createdAt DESC")
    List<TutoringSession> findByParticipant(@Param("userId") String userId);
}
