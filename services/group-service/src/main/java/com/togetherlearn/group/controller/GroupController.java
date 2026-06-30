package com.togetherlearn.group.controller;

import com.togetherlearn.group.dto.CreateGroupRequest;
import com.togetherlearn.group.dto.GroupResponse;
import com.togetherlearn.group.dto.UpdateGroupRequest;
import com.togetherlearn.group.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupResponse>> listGroups(
            @RequestParam(required = false) String courseCode) {
        return ResponseEntity.ok(groupService.listGroups(courseCode));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest req,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(req, userId));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroup(groupId));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable String groupId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UpdateGroupRequest req) {
        return ResponseEntity.ok(groupService.updateGroup(groupId, userId, req));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable String groupId,
            @RequestHeader("X-User-Id") String userId) {
        groupService.deleteGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> joinGroup(
            @PathVariable String groupId,
            @RequestHeader("X-User-Id") String userId) {
        groupService.joinGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable String groupId,
            @RequestHeader("X-User-Id") String userId) {
        groupService.leaveGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }
}
