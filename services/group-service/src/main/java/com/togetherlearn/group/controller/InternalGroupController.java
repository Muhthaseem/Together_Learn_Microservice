package com.togetherlearn.group.controller;

import com.togetherlearn.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/internal/groups")
@RequiredArgsConstructor
public class InternalGroupController {

    private final GroupService groupService;

    @GetMapping("/{groupId}/exists")
    public ResponseEntity<Map<String, Boolean>> groupExists(@PathVariable String groupId) {
        return ResponseEntity.ok(Map.of("exists", groupService.groupExists(groupId)));
    }
}
