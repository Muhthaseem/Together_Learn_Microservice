package com.togetherlearn.group.service;

import com.togetherlearn.group.dto.CreateGroupRequest;
import com.togetherlearn.group.dto.GroupResponse;
import com.togetherlearn.group.dto.UpdateGroupRequest;
import com.togetherlearn.group.entity.GroupParticipant;
import com.togetherlearn.group.entity.StudyGroup;
import com.togetherlearn.group.messaging.EventPublisher;
import com.togetherlearn.group.repository.GroupParticipantRepository;
import com.togetherlearn.group.repository.StudyGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class GroupService {

    private final StudyGroupRepository groupRepository;
    private final GroupParticipantRepository participantRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest req, String creatorId) {
        StudyGroup group = StudyGroup.builder()
                .groupId(UUID.randomUUID().toString())
                .title(req.getTitle())
                .description(req.getDescription())
                .creatorId(creatorId)
                .courseCode(req.getCourseCode())
                .scheduledDate(req.getScheduledDate())
                .scheduledTime(req.getScheduledTime())
                .location(req.getLocation())
                .mode(req.getMode())
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 20)
                .build();

        StudyGroup saved = groupRepository.save(group);

        participantRepository.save(GroupParticipant.builder()
                .groupId(saved.getGroupId())
                .userId(creatorId)
                .role("HOST")
                .build());

        return toResponse(saved, false);
    }

    public List<GroupResponse> listGroups(String courseCode) {
        List<StudyGroup> groups = courseCode != null
                ? groupRepository.findByCourseCode(courseCode)
                : groupRepository.findAll();
        return groups.stream().map(g -> toResponse(g, false)).collect(Collectors.toList());
    }

    public GroupResponse getGroup(String groupId) {
        StudyGroup group = findGroup(groupId);
        return toResponse(group, true);
    }

    @Transactional
    public GroupResponse updateGroup(String groupId, String requesterId, UpdateGroupRequest req) {
        StudyGroup group = findGroup(groupId);
        if (!group.getCreatorId().equals(requesterId)) {
            throw new SecurityException("Only the group creator can update this group");
        }
        if (req.getTitle() != null) group.setTitle(req.getTitle());
        if (req.getDescription() != null) group.setDescription(req.getDescription());
        if (req.getScheduledDate() != null) group.setScheduledDate(req.getScheduledDate());
        if (req.getScheduledTime() != null) group.setScheduledTime(req.getScheduledTime());
        if (req.getLocation() != null) group.setLocation(req.getLocation());
        if (req.getMode() != null) group.setMode(req.getMode());
        if (req.getMaxParticipants() != null) group.setMaxParticipants(req.getMaxParticipants());
        if (req.getStatus() != null) group.setStatus(req.getStatus());
        return toResponse(groupRepository.save(group), false);
    }

    @Transactional
    public void deleteGroup(String groupId, String requesterId) {
        StudyGroup group = findGroup(groupId);
        if (!group.getCreatorId().equals(requesterId)) {
            throw new SecurityException("Only the group creator can delete this group");
        }
        participantRepository.findByGroupId(groupId)
                .forEach(p -> participantRepository.deleteByGroupIdAndUserId(groupId, p.getUserId()));
        groupRepository.delete(group);
    }

    @Transactional
    public void joinGroup(String groupId, String userId) {
        StudyGroup group = findGroup(groupId);
        if (!"ACTIVE".equals(group.getStatus())) {
            throw new IllegalArgumentException("Group is not active");
        }
        if (participantRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalArgumentException("Already a member of this group");
        }
        long count = participantRepository.countByGroupId(groupId);
        if (count >= group.getMaxParticipants()) {
            throw new IllegalArgumentException("Group is full");
        }
        participantRepository.save(GroupParticipant.builder()
                .groupId(groupId)
                .userId(userId)
                .role("MEMBER")
                .build());

        if (!userId.equals(group.getCreatorId())) {
            eventPublisher.publishGroupJoin(group.getCreatorId(), group.getTitle(), groupId);
        }
    }

    @Transactional
    public void leaveGroup(String groupId, String userId) {
        StudyGroup group = findGroup(groupId);
        if (group.getCreatorId().equals(userId)) {
            throw new IllegalArgumentException("Creator cannot leave — close the group instead");
        }
        if (!participantRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalArgumentException("Not a member of this group");
        }
        participantRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    public boolean groupExists(String groupId) {
        return groupRepository.existsByGroupId(groupId);
    }

    private StudyGroup findGroup(String groupId) {
        return groupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
    }

    private GroupResponse toResponse(StudyGroup g, boolean includeParticipants) {
        long count = participantRepository.countByGroupId(g.getGroupId());
        List<GroupResponse.ParticipantDto> participants = null;
        if (includeParticipants) {
            participants = participantRepository.findByGroupId(g.getGroupId()).stream()
                    .map(p -> GroupResponse.ParticipantDto.builder()
                            .userId(p.getUserId())
                            .role(p.getRole())
                            .build())
                    .collect(Collectors.toList());
        }
        return GroupResponse.builder()
                .groupId(g.getGroupId())
                .title(g.getTitle())
                .description(g.getDescription())
                .creatorId(g.getCreatorId())
                .courseCode(g.getCourseCode())
                .scheduledDate(g.getScheduledDate())
                .scheduledTime(g.getScheduledTime())
                .location(g.getLocation())
                .mode(g.getMode())
                .status(g.getStatus())
                .maxParticipants(g.getMaxParticipants())
                .participantCount(count)
                .createdAt(g.getCreatedAt())
                .participants(participants)
                .build();
    }
}
