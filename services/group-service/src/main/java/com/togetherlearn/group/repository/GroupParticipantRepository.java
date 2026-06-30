package com.togetherlearn.group.repository;

import com.togetherlearn.group.entity.GroupParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupParticipantRepository extends JpaRepository<GroupParticipant, Long> {
    List<GroupParticipant> findByGroupId(String groupId);
    Optional<GroupParticipant> findByGroupIdAndUserId(String groupId, String userId);
    boolean existsByGroupIdAndUserId(String groupId, String userId);
    long countByGroupId(String groupId);
    void deleteByGroupIdAndUserId(String groupId, String userId);
}
