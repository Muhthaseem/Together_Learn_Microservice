package com.togetherlearn.course.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private static final List<String> DEPARTMENTS = List.of(
            "First Year", "CO", "CE", "ME", "EEE"
    );

    private static final List<String> BATCHES = List.of(
            "Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5",
            "Batch 6", "Batch 7", "Batch 8", "Batch 9", "Batch 10"
    );

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getDepartments() {
        return ResponseEntity.ok(DEPARTMENTS);
    }

    @GetMapping("/batches")
    public ResponseEntity<List<String>> getBatches() {
        return ResponseEntity.ok(BATCHES);
    }
}
