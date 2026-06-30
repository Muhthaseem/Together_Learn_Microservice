package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.PeerApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeerApplicationRepository extends JpaRepository<PeerApplication, Long> {
    Optional<PeerApplication> findByApplicationId(String applicationId);
    List<PeerApplication> findByRequestId(String requestId);
    boolean existsByRequestIdAndApplicantId(String requestId, String applicantId);
}
