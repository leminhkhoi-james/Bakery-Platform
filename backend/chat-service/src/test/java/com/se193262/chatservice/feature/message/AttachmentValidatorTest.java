package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.exception.ChatException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttachmentValidatorTest {

    private final AttachmentValidator validator = new AttachmentValidator();

    @Test
    void acceptsImageWithMatchingFileSignatureAndMediaType() {
        byte[] pngHeader = {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile file = new MockMultipartFile(
                "files", "cake.png", MediaType.IMAGE_PNG_VALUE, pngHeader);

        List<AttachmentFile> result = validator.validate(MessageType.IMAGE, List.of(file));

        assertEquals("image/png", result.getFirst().mediaType());
        assertEquals("cake.png", result.getFirst().originalFileName());
    }

    @Test
    void rejectsFileWhenDeclaredTypeDoesNotMatchItsSignature() {
        MockMultipartFile file = new MockMultipartFile(
                "files", "cake.png", MediaType.IMAGE_PNG_VALUE, "%PDF-1.7".getBytes());

        assertThrows(ChatException.class, () -> validator.validate(MessageType.IMAGE, List.of(file)));
    }

    @Test
    void rejectsAttachmentsOnTextMessages() {
        MockMultipartFile file = new MockMultipartFile(
                "files", "cake.png", MediaType.IMAGE_PNG_VALUE,
                new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a});

        assertThrows(ChatException.class, () -> validator.validate(MessageType.TEXT, List.of(file)));
    }
}
