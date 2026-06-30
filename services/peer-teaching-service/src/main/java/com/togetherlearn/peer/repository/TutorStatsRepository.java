package com.togetherlearn.peer.repository;

import com.togetherlearn.peer.entity.TutorStats;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorStatsRepository extends JpaRepository<TutorStats, String> {
}
