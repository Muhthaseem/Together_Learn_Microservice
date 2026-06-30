package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.PeerOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeerOfferRepository extends JpaRepository<PeerOffer, Long> {
    Optional<PeerOffer> findByOfferId(String offerId);
    List<PeerOffer> findByCourseCode(String courseCode);
    List<PeerOffer> findByStatus(String status);
}
