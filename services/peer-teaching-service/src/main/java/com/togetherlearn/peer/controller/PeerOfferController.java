package com.togetherlearn.peer.controller;

import com.togetherlearn.peer.dto.CreatePeerOfferDto;
import com.togetherlearn.peer.dto.PeerOfferResponse;
import com.togetherlearn.peer.service.PeerTeachingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/peer-offers")
@RequiredArgsConstructor
public class PeerOfferController {

    private final PeerTeachingService peerService;

    @GetMapping
    public ResponseEntity<List<PeerOfferResponse>> listOffers(
            @RequestParam(required = false) String courseCode) {
        return ResponseEntity.ok(peerService.listOffers(courseCode));
    }

    @PostMapping
    public ResponseEntity<PeerOfferResponse> createOffer(
            @Valid @RequestBody CreatePeerOfferDto dto,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(peerService.createOffer(dto, userId));
    }

    @PutMapping("/{offerId}")
    public ResponseEntity<PeerOfferResponse> updateOffer(
            @PathVariable String offerId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(peerService.updateOffer(offerId, userId, body.get("status")));
    }
}
