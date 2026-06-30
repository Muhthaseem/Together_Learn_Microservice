package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.TutorRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorRatingRepository extends JpaRepository<TutorRating, Long> {

    Optional<TutorRating> findBySessionId(String sessionId);

    boolean existsBySessionId(String sessionId);
}
