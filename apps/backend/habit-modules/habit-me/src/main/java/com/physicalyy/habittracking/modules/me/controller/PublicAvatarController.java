package com.physicalyy.habittracking.modules.me.controller;

import com.physicalyy.habittracking.modules.me.service.AvatarStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/avatars")
public class PublicAvatarController {

    private final AvatarStorageService avatarStorageService;

    public PublicAvatarController(AvatarStorageService avatarStorageService) {
        this.avatarStorageService = avatarStorageService;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> avatar(@PathVariable String filename) {
        return ResponseEntity.ok()
                .contentType(avatarStorageService.mediaType(filename))
                .body(avatarStorageService.loadAvatar(filename));
    }
}
