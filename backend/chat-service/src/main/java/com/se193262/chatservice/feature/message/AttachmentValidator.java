package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.exception.ChatException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class AttachmentValidator {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final int MAX_FILES = 5;

    public List<AttachmentFile> validate(MessageType type, List<MultipartFile> files) {
        List<MultipartFile> provided = files == null ? List.of() : files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
        if (type == MessageType.TEXT) {
            if (!provided.isEmpty()) {
                throw invalid("Text messages cannot contain attachments");
            }
            return List.of();
        }
        if (type != MessageType.IMAGE && type != MessageType.FILE) {
            throw invalid("Unsupported message type");
        }
        if (provided.isEmpty() || provided.size() > MAX_FILES) {
            throw invalid("Image and file messages require between one and five attachments");
        }
        List<AttachmentFile> result = new ArrayList<>(provided.size());
        for (MultipartFile file : provided) {
            if (file.getSize() <= 0 || file.getSize() > MAX_FILE_SIZE) {
                throw invalid("Each attachment must be between 1 byte and 10 MB");
            }
            try {
                byte[] bytes = file.getBytes();
                String mediaType = detectMediaType(bytes);
                String declaredType = file.getContentType();
                if (mediaType == null || declaredType == null
                        || !mediaType.equalsIgnoreCase(declaredType.split(";", 2)[0].trim())) {
                    throw invalid("Attachment content does not match its declared media type");
                }
                if (type == MessageType.IMAGE && !mediaType.startsWith("image/")) {
                    throw invalid("Image messages can contain only image attachments");
                }
                result.add(new AttachmentFile(safeFileName(file.getOriginalFilename()), mediaType, bytes));
            } catch (IOException exception) {
                throw new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, "An attachment could not be read");
            }
        }
        return List.copyOf(result);
    }

    private String detectMediaType(byte[] bytes) {
        if (startsWith(bytes, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff})) {
            return "image/jpeg";
        }
        if (startsWith(bytes, new byte[]{
                (byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a})) {
            return "image/png";
        }
        if (bytes.length >= 12 && ascii(bytes, 0, 4).equals("RIFF")
                && ascii(bytes, 8, 4).equals("WEBP")) {
            return "image/webp";
        }
        if (bytes.length >= 5 && ascii(bytes, 0, 5).equals("%PDF-")) {
            return "application/pdf";
        }
        return null;
    }

    private boolean startsWith(byte[] bytes, byte[] prefix) {
        if (bytes.length < prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if (bytes[index] != prefix[index]) {
                return false;
            }
        }
        return true;
    }

    private String ascii(byte[] bytes, int offset, int length) {
        return new String(bytes, offset, length, StandardCharsets.US_ASCII);
    }

    private String safeFileName(String fileName) {
        String normalized = fileName == null ? "" : fileName.replace('\\', '/');
        String leaf = normalized.substring(normalized.lastIndexOf('/') + 1)
                .replaceAll("[\\p{Cntrl}]", "")
                .trim();
        if (leaf.isBlank()) {
            return "attachment";
        }
        return leaf.length() <= 255 ? leaf : leaf.substring(0, 255);
    }

    private ChatException invalid(String message) {
        return new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
