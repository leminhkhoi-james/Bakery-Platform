package com.se193262.platform.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import static org.assertj.core.api.Assertions.assertThat;

class PlatformExceptionHandlerTest {
    @Test
    void unsupportedMedia_returns415AndSupportedTypeWithoutMaskingServerFailures() {
        var error = new HttpMediaTypeNotSupportedException(MediaType.APPLICATION_JSON,
                java.util.List.of(MediaType.MULTIPART_FORM_DATA));
        var response = new PlatformExceptionHandler().unsupportedMedia(error);
        assertThat(response.getStatusCode().value()).isEqualTo(415);
        assertThat(response.getHeaders().getAccept()).contains(MediaType.MULTIPART_FORM_DATA);
    }
}
