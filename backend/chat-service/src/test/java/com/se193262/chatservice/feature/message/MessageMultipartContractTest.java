package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MessageMultipartContractTest {
    @Test
    @DisplayName("Malformed multipart yields API errors before any message or storage write")
    void send_invalidMultipart_returnsExplicitClientErrors() throws Exception {
        var service = mock(MessageService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new MessageController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
        String path = "/api/v1/conversations/" + UUID.randomUUID() + "/messages";
        mvc.perform(multipart(path).file(new MockMultipartFile("metadata", "", "text/plain",
                        "{}".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.statusCode").value(415));
        mvc.perform(multipart(path)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
        mvc.perform(multipart(path).file(new MockMultipartFile("metadata", "", "application/json",
                        "{broken".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.statusCode").value(400));
        verifyNoInteractions(service);
    }
}
