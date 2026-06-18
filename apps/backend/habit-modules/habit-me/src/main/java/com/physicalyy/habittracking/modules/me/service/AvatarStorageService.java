package com.physicalyy.habittracking.modules.me.service;

import com.physicalyy.habittracking.common.exception.BusinessException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class AvatarStorageService {

    public static final String PUBLIC_AVATAR_PREFIX = "/api/public/avatars/";
    private static final Logger log = LoggerFactory.getLogger(AvatarStorageService.class);
    private static final long MAX_AVATAR_BYTES = 2L * 1024L * 1024L;

    private final Path storageDir;

    public AvatarStorageService(
            @Value("${AVATAR_STORAGE_DIR:${avatar.storage-dir:./data/avatars}}") String storageDir
    ) {
        this.storageDir = Paths.get(storageDir).toAbsolutePath().normalize();
    }

    public String saveAvatar(UserAccount user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("BAD_REQUEST", "Avatar file is required");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new BusinessException("BAD_REQUEST", "Avatar file is too large");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new BusinessException("BAD_REQUEST", "Avatar file is invalid");
        }

        ImageFormat format = detectImageFormat(file.getContentType(), bytes);
        String filename = user.getId() + "-" + UUID.randomUUID() + "." + format.extension;
        Path target = storageDir.resolve(filename).normalize();
        if (!target.startsWith(storageDir)) {
            throw new BusinessException("BAD_REQUEST", "Avatar file is invalid");
        }

        try {
            Files.createDirectories(storageDir);
            Files.write(target, bytes);
        } catch (IOException exception) {
            throw new BusinessException("BAD_REQUEST", "Avatar file cannot be saved");
        }

        return PUBLIC_AVATAR_PREFIX + filename;
    }

    public Resource loadAvatar(String filename) {
        Path file = resolveAvatarFile(filename);
        if (!Files.isRegularFile(file)) {
            throw new BusinessException("BAD_REQUEST", "Avatar file not found");
        }
        return new FileSystemResource(file);
    }

    public MediaType mediaType(String filename) {
        String normalized = filename.toLowerCase(Locale.ROOT);
        if (normalized.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (normalized.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }

    public void validateAvatarUrl(UserAccount user, String avatarUrl) {
        if (!StringUtils.hasText(avatarUrl)) {
            return;
        }
        String filename = extractFilename(avatarUrl);
        String expectedPrefix = user.getId() + "-";
        if (!filename.startsWith(expectedPrefix)) {
            throw new BusinessException("BAD_REQUEST", "Avatar URL is invalid");
        }
        if (!Files.isRegularFile(resolveAvatarFile(filename))) {
            throw new BusinessException("BAD_REQUEST", "Avatar file not found");
        }
    }

    public void deleteIfLocalAvatar(String avatarUrl) {
        if (!StringUtils.hasText(avatarUrl) || !avatarUrl.startsWith(PUBLIC_AVATAR_PREFIX)) {
            return;
        }
        try {
            Files.deleteIfExists(resolveAvatarFile(extractFilename(avatarUrl)));
        } catch (IOException exception) {
            log.warn("Failed to delete previous avatar file");
        }
    }

    private Path resolveAvatarFile(String filename) {
        if (!StringUtils.hasText(filename) || filename.contains("/") || filename.contains("\\")) {
            throw new BusinessException("BAD_REQUEST", "Avatar file not found");
        }
        try {
            Path file = storageDir.resolve(filename).normalize();
            if (!file.startsWith(storageDir)) {
                throw new BusinessException("BAD_REQUEST", "Avatar file not found");
            }
            return file;
        } catch (InvalidPathException exception) {
            throw new BusinessException("BAD_REQUEST", "Avatar file not found");
        }
    }

    private String extractFilename(String avatarUrl) {
        if (!avatarUrl.startsWith(PUBLIC_AVATAR_PREFIX)) {
            throw new BusinessException("BAD_REQUEST", "Avatar URL is invalid");
        }
        return avatarUrl.substring(PUBLIC_AVATAR_PREFIX.length());
    }

    private ImageFormat detectImageFormat(String contentType, byte[] bytes) {
        ImageFormat format = detectMagic(bytes);
        String normalizedContentType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!format.contentType.equals(normalizedContentType)) {
            throw new BusinessException("BAD_REQUEST", "Avatar file type is invalid");
        }
        return format;
    }

    private ImageFormat detectMagic(byte[] bytes) {
        if (bytes.length >= 8
                && (bytes[0] & 0xff) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4e
                && bytes[3] == 0x47
                && bytes[4] == 0x0d
                && bytes[5] == 0x0a
                && bytes[6] == 0x1a
                && bytes[7] == 0x0a) {
            return ImageFormat.PNG;
        }
        if (bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff) {
            return ImageFormat.JPEG;
        }
        if (bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P') {
            return ImageFormat.WEBP;
        }
        throw new BusinessException("BAD_REQUEST", "Avatar file type is invalid");
    }

    private enum ImageFormat {
        JPEG("jpg", MediaType.IMAGE_JPEG_VALUE),
        PNG("png", MediaType.IMAGE_PNG_VALUE),
        WEBP("webp", "image/webp");

        private final String extension;
        private final String contentType;

        ImageFormat(String extension, String contentType) {
            this.extension = extension;
            this.contentType = contentType;
        }
    }
}
