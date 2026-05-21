package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.PeerRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeerRequestRepository extends JpaRepository<PeerRequest, Long> {
    Optional<PeerRequest> findByRequestId(String requestId);
    List<PeerRequest> findByCourseCode(String courseCode);
    List<PeerRequest> findByStatus(String status);
    List<PeerRequest> findByCourseCodeAndStatus(String courseCode, String status);
    List<PeerRequest> findByDepartmentAndStatus(String department, String status);
    List<PeerRequest> findByCourseCodeAndDepartmentAndStatus(String courseCode, String department, String status);
}
