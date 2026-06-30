package com.togetherlearn.chat.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "GROUP-STUDY-SERVICE")
public interface GroupClient {

    @GetMapping("/internal/groups/{groupId}/exists")
    Map<String, Boolean> groupExists(@PathVariable("groupId") String groupId);
}
