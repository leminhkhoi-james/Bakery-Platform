package com.se193262.orderservice.infrastructure.client;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.exception.BusinessException;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import tools.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;

@Component
public class AddOnInventoryClient {
    private final ServiceHttpClient serviceHttp;
    private final ObjectMapper json;
    private final RestClient client;
    public record Selection(UUID addOnId, int quantity) {}

    public AddOnInventoryClient(ServiceHttpClient serviceHttp, ObjectMapper json) {
        this.serviceHttp = serviceHttp;
        this.json = json;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    public void allocate(UUID bakeryId, UUID orderId, List<Selection> selections) {
        post(bakeryId, orderId, "allocate", Map.of("addOns", selections));
    }

    public void release(UUID bakeryId, UUID orderId) { post(bakeryId, orderId, "release", Map.of()); }

    private void post(UUID bakeryId, UUID orderId, String action, Object body) {
        try {
            client.post().uri(serviceHttp.properties().bakeryUrl() + "/internal/v1/bakeries/" + bakeryId
                            + "/inventory/orders/" + orderId + "/" + action)
                    .headers(headers -> headers.setBearerAuth(serviceHttp.serviceToken("bakery-service", "bakery:catalog:quote")))
                    .header("X-Correlation-Id", com.se193262.platform.security.CorrelationIds.currentOrNew())
                    .body(body).retrieve().toBodilessEntity();
        } catch (RestClientResponseException error) {
            int status = error.getStatusCode().value();
            if (status == 409 || status == 422 || status == 400) {
                String message = "Không thể cập nhật tồn kho phụ kiện. Vui lòng kiểm tra lại sản phẩm.";
                try { message = json.readTree(error.getResponseBodyAsString()).path("message").asText(message); }
                catch (RuntimeException ignored) { /* Keep a useful fallback if the upstream body is malformed. */ }
                throw new BusinessException(status, message);
            }
            throw BusinessException.unavailable();
        } catch (RestClientException error) { throw BusinessException.unavailable(); }
    }
}
