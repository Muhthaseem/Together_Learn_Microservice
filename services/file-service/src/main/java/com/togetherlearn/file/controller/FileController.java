package com.togetherlearn.file.controller;

import com.togetherlearn.file.dto.UploadResponse;
import com.togetherlearn.file.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService storageService;

    // POST /api/files/upload?folder=avatars
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "uploads") String folder) throws IOException {
        return ResponseEntity.ok(storageService.upload(file, folder));
    }

    // DELETE /api/files?key=uploads/uuid-filename.jpg
    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam String key) {
        storageService.delete(key);
        return ResponseEntity.noContent().build();
    }

    // GET /api/files/presigned?key=uploads/uuid-filename.jpg&expiryMinutes=60
    @GetMapping("/presigned")
    public ResponseEntity<Map<String, String>> presigned(
            @RequestParam String key,
            @RequestParam(defaultValue = "60") int expiryMinutes) {
        String url = storageService.presignedUrl(key, expiryMinutes);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
