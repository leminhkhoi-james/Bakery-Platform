package com.se193262.marketplaceservice;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.se193262.marketplaceservice.feature.cakerequest.RequestImageService;
import com.se193262.marketplaceservice.feature.offer.*;
import com.se193262.marketplaceservice.infrastructure.client.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.*;
import com.se193262.marketplaceservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;

import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class MarketplaceServiceApplicationTests {
    @Container
    static final PostgreSQLContainer database =
            new PostgreSQLContainer(
                    org.testcontainers.utility.DockerImageName.parse(
                                    System.getProperty("test.postgres.image", "postgres:17-alpine"))
                            .asCompatibleSubstituteFor("postgres"));

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry p) {
        p.add("spring.datasource.url", database::getJdbcUrl);
        p.add("spring.datasource.username", database::getUsername);
        p.add("spring.datasource.password", database::getPassword);
        p.add("marketplace.scheduler-delay-ms", () -> "3600000");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcClient jdbc;
    @Autowired OfferAcceptanceService acceptance;
    @Autowired RequestImageService imageService;
    @MockitoBean BakeryClient bakery;
    @MockitoBean SubscriptionClient subscription;
    @MockitoBean CakeAiClient ai;
    @MockitoBean OrderClient orders;
    @MockitoBean ImageStorage storage;
    @MockitoBean JwtDecoder decoder;
    final UUID customer = UUID.randomUUID(),
            bakeryId = UUID.randomUUID(),
            member = UUID.randomUUID(),
            address = UUID.randomUUID();

    @BeforeEach
    void prepare() {
        jdbc.sql("truncate cake_requests cascade").update();
        when(bakery.membership(any(), eq(member)))
                .thenAnswer(a -> new Membership(a.getArgument(0), member, true, "OWNER", true));
        when(bakery.memberships(member))
                .thenReturn(List.of(new Membership(bakeryId, member, true, "OWNER", true)));
        when(bakery.bakery(bakeryId))
                .thenReturn(
                        new Bakery(
                                bakeryId,
                                "Bakery",
                                "ACTIVE",
                                List.of(new Area("HCM", "D1", BigDecimal.ZERO, BigDecimal.ZERO))));
        when(subscription.active(any())).thenReturn(true);
        when(bakery.quote(any()))
                .thenAnswer(
                        a -> {
                            QuoteRequest q = a.getArgument(0);
                            return new Quote(
                                    q.productId(),
                                    "Cake",
                                    true,
                                    0,
                                    List.of(),
                                    List.of(),
                                    BigDecimal.ZERO);
                        });
        when(orders.create(any()))
                .thenReturn(new OrderClient.OrderResult(UUID.randomUUID(), "ORD-TEST", "PENDING"));
        when(storage.signedUrl(any())).thenReturn("https://example.invalid/signed");
    }

    org.springframework.test.web.servlet.request.RequestPostProcessor user(UUID id, String role) {
        return jwt().jwt(j -> j.subject(id.toString()).claim("token_type", "user"))
                .authorities(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_" + role));
    }

    String command() throws Exception {
        return json.writeValueAsString(
                Map.of(
                        "requestType",
                        "OPEN_CUSTOM",
                        "title",
                        "Birthday cake",
                        "description",
                        "Chocolate flowers",
                        "neededAt",
                        Instant.now().plusSeconds(86400).toString(),
                        "deliveryCity",
                        "HCM",
                        "deliveryDistrict",
                        "D1"));
    }

    @Test
    @DisplayName("Swagger UI and OpenAPI documentation are publicly accessible")
    void apiDocumentation_withoutAuthentication_isAccessible() throws Exception {
        mvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(
                        jsonPath("$.components.securitySchemes.bearerAuth.type")
                                .value("http"))
                .andExpect(
                        jsonPath("$.components.securitySchemes.bearerAuth.scheme")
                                .value("bearer"));
    }

    UUID create() throws Exception {
        var response =
                mvc.perform(
                                post("/api/v1/cake-requests")
                                        .with(user(customer, "CUSTOMER"))
                                        .contentType("application/json")
                                        .content(command()))
                        .andExpect(status().isCreated())
                        .andReturn();
        return UUID.fromString(
                json.readTree(response.getResponse().getContentAsString())
                        .path("data")
                        .path("id")
                        .asText());
    }

    UUID open() throws Exception {
        UUID id = create();
        mvc.perform(
                        post("/api/v1/cake-requests/" + id + "/publish")
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isOk());
        return id;
    }

    UUID offer(UUID request) throws Exception {
        return offer(request, bakeryId);
    }

    UUID offer(UUID request, UUID submittingBakery) throws Exception {
        String body =
                json.writeValueAsString(
                        Map.of(
                                "bakeryId",
                                submittingBakery,
                                "cakePrice",
                                900000,
                                "deliveryFee",
                                30000,
                                "estimatedCompletionAt",
                                Instant.now().plusSeconds(3600).toString(),
                                "expiresAt",
                                Instant.now().plusSeconds(7200).toString(),
                                "items",
                                List.of()));
        var result =
                mvc.perform(
                                post("/api/v1/cake-requests/" + request + "/offers")
                                        .with(user(member, "BAKERY_OWNER"))
                                        .contentType("application/json")
                                        .content(body))
                        .andExpect(status().isCreated())
                        .andReturn();
        return UUID.fromString(
                json.readTree(result.getResponse().getContentAsString())
                        .path("data")
                        .path("id")
                        .asText());
    }

    ResultActions accept(UUID offer, String key, UUID delivery) throws Exception {
        return mvc.perform(
                post("/api/v1/offers/" + offer + "/accept")
                        .with(user(customer, "CUSTOMER"))
                        .header("Idempotency-Key", key)
                        .contentType("application/json")
                        .content(json.writeValueAsString(Map.of("deliveryAddressId", delivery))));
    }

    @Test
    @DisplayName("Open custom request accepts exactly one offer and replays its order")
    void acceptOffer_replay_returnsSameOrder() throws Exception {
        UUID request = open(), selected = offer(request), other = offer(request, UUID.randomUUID());
        String first =
                accept(selected, "key-1", address)
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.data.offerStatus").value("ACCEPTED"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        String replay =
                accept(selected, "key-1", address)
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertEquals(json.readTree(first).path("data"), json.readTree(replay).path("data"));
        verify(orders, times(1)).create(any());
        mvc.perform(get("/api/v1/offers/" + other).with(user(customer, "CUSTOMER")))
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
        accept(selected, "key-1", UUID.randomUUID()).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Timeout keeps reservation and recovery finalizes without another selection")
    void acceptOffer_timeout_recoveryCompletes() throws Exception {
        UUID request = open(), selected = offer(request), other = offer(request, UUID.randomUUID());
        when(orders.create(any()))
                .thenThrow(BusinessException.unavailable())
                .thenReturn(
                        new OrderClient.OrderResult(UUID.randomUUID(), "ORD-RECOVERED", "PENDING"));
        accept(selected, "timeout-key", address).andExpect(status().isServiceUnavailable());
        accept(other, "another-key", address).andExpect(status().isConflict());
        mvc.perform(
                        post("/api/v1/cake-requests/" + request + "/cancel")
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isConflict());
        jdbc.sql("update offer_acceptance_workflows set next_retry_at=now()-interval '1 minute'")
                .update();
        acceptance.recover();
        accept(selected, "timeout-key", address)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderNumber").value("ORD-RECOVERED"));
    }

    @Test
    @DisplayName("Invalid address releases reservation and preserves the failed-key result")
    void acceptOffer_invalidAddress_releasesReservation() throws Exception {
        UUID request = open(), selected = offer(request);
        when(orders.create(any())).thenThrow(BusinessException.invalid("Address invalid"));
        accept(selected, "bad-address", address).andExpect(status().isUnprocessableEntity());
        accept(selected, "bad-address", address).andExpect(status().isUnprocessableEntity());
        verify(orders, times(1)).create(any());
        doReturn(new OrderClient.OrderResult(UUID.randomUUID(), "ORD-NEW", "PENDING"))
                .when(orders)
                .create(any());
        accept(selected, "fixed-address", UUID.randomUUID()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Only owners see drafts and bakery listings filter before pagination")
    void requestList_permissions_filtersBeforePagination() throws Exception {
        UUID draft = create(), available = open();
        mvc.perform(get("/api/v1/cake-requests/" + draft).with(user(UUID.randomUUID(), "CUSTOMER")))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get("/api/v1/cake-requests")
                                .param("scope", "available")
                                .param("size", "1")
                                .with(user(member, "BAKERY_OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.meta.total").value(1))
                .andExpect(jsonPath("$.data.result[0].id").value(available.toString()));
        mvc.perform(
                        get("/api/v1/cake-requests")
                                .param("sort", "customerId,asc")
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Patch distinguishes omitted fields and explicit null")
    void patchDraft_nullableField_preservesOtherFields() throws Exception {
        UUID request = create();
        mvc.perform(
                        patch("/api/v1/cake-requests/" + request)
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content("{\"occasion\":\"BIRTHDAY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Birthday cake"));
        mvc.perform(
                        patch("/api/v1/cake-requests/" + request)
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content("{\"occasion\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.occasion").doesNotExist());
        mvc.perform(
                        patch("/api/v1/cake-requests/" + request)
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content("{\"title\":null}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("Upload persists metadata and prevents changes after publish")
    void images_publish_preventsDeletion() throws Exception {
        UUID request = create();
        byte[] bytes = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
        var response =
                mvc.perform(
                                multipart("/api/v1/cake-requests/" + request + "/images")
                                        .file(
                                                new MockMultipartFile(
                                                        "files", "cake.png", "image/png", bytes))
                                        .with(user(customer, "CUSTOMER")))
                        .andExpect(status().isCreated())
                        .andReturn();
        String image =
                json.readTree(response.getResponse().getContentAsString())
                        .path("data")
                        .get(0)
                        .path("id")
                        .asText();
        mvc.perform(
                        post("/api/v1/cake-requests/" + request + "/publish")
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isOk());
        mvc.perform(
                        delete("/api/v1/cake-requests/" + request + "/images/" + image)
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Partial upload failure compensates storage and writes no metadata")
    void images_partialFailure_cleansObjects() throws Exception {
        UUID request = create();
        doNothing()
                .doThrow(BusinessException.unavailable())
                .when(storage)
                .upload(any(), any(), any());
        byte[] bytes = {(byte) 255, (byte) 216, (byte) 255};
        mvc.perform(
                        multipart("/api/v1/cake-requests/" + request + "/images")
                                .file(new MockMultipartFile("files", "a.jpg", "image/jpeg", bytes))
                                .file(new MockMultipartFile("files", "b.jpg", "image/jpeg", bytes))
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isServiceUnavailable());
        assertEquals(
                0, jdbc.sql("select count(*) from request_images").query(Integer.class).single());
        verify(storage, times(2)).delete(any());
    }

    @Test
    @DisplayName("User JWT cannot invoke internal API and service JWT cannot invoke public API")
    void internalApi_wrongTokenType_isForbidden() throws Exception {
        UUID request = create();
        mvc.perform(
                        get("/internal/v1/cake-requests/" + request + "/context")
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get("/api/v1/cake-requests")
                                .with(
                                        jwt().jwt(
                                                        j ->
                                                                j.subject("order-service")
                                                                        .claim(
                                                                                "token_type",
                                                                                "service"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/cake-requests")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Two concurrent offer selections cannot create two orders")
    void acceptOffer_concurrentSelections_onlyOneSucceeds() throws Exception {
        UUID request = open(), one = offer(request), two = offer(request, UUID.randomUUID());
        var pool = java.util.concurrent.Executors.newFixedThreadPool(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        try {
            var a =
                    pool.submit(
                            () -> {
                                start.await();
                                return accept(one, "race-a", address)
                                        .andReturn()
                                        .getResponse()
                                        .getStatus();
                            });
            var b =
                    pool.submit(
                            () -> {
                                start.await();
                                return accept(two, "race-b", address)
                                        .andReturn()
                                        .getResponse()
                                        .getStatus();
                            });
            start.countDown();
            var results = List.of(a.get(), b.get());
            assertEquals(1, results.stream().filter(code -> code == 200).count());
            assertTrue(results.contains(409));
            verify(orders, times(1)).create(any());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    @DisplayName("Offer patch recalculates totals and withdrawal prevents acceptance")
    void offer_patchAndWithdraw_obeysStateRules() throws Exception {
        UUID request = open(), selected = offer(request);
        mvc.perform(
                        patch("/api/v1/offers/" + selected)
                                .with(user(member, "BAKERY_OWNER"))
                                .contentType("application/json")
                                .content(json.writeValueAsString(Map.of("cakePrice", 950000))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPrice").value(980000));
        mvc.perform(
                        post("/api/v1/offers/" + selected + "/withdraw")
                                .with(user(member, "BAKERY_OWNER"))
                                .contentType("application/json")
                                .content(
                                        json.writeValueAsString(
                                                Map.of("reason", "Capacity changed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("WITHDRAWN"));
        accept(selected, "withdrawn", address).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Cancelling an open request rejects its pending offers atomically")
    void cancelRequest_pendingOffer_rejectsOffer() throws Exception {
        UUID request = open(), selected = offer(request);
        mvc.perform(
                        post("/api/v1/cake-requests/" + request + "/cancel")
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
        mvc.perform(get("/api/v1/offers/" + selected).with(user(customer, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
        mvc.perform(
                        get("/api/v1/cake-requests")
                                .param("scope", "available")
                                .with(user(member, "BAKERY_OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.meta.total").value(0));
        mvc.perform(get("/api/v1/cake-requests/" + request).with(user(member, "BAKERY_OWNER")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Only approved designs of this customer and request can be selected")
    void selectedDesign_ownerAndModeration_areEnforced() throws Exception {
        UUID request = create(), design = UUID.randomUUID();
        when(ai.validate(design, customer, request))
                .thenReturn(
                        new CakeAiClient.Design(design, true, true, true, "APPROVED", "SUCCEEDED"));
        mvc.perform(
                        put("/api/v1/cake-requests/" + request + "/selected-design")
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content(
                                        json.writeValueAsString(
                                                Map.of("generatedDesignId", design))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedDesign.id").value(design.toString()));
        when(ai.validate(design, customer, request))
                .thenReturn(
                        new CakeAiClient.Design(
                                design, true, false, true, "APPROVED", "SUCCEEDED"));
        mvc.perform(
                        put("/api/v1/cake-requests/" + request + "/selected-design")
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content(
                                        json.writeValueAsString(
                                                Map.of("generatedDesignId", design))))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("A failed mandatory catalog validation cannot create a targeted request")
    void createTargeted_remoteUnavailable_returns503() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("requestType", "TARGETED_PRODUCT_CUSTOM");
        body.put("targetBakeryId", bakeryId);
        body.put("baseProductId", UUID.randomUUID());
        body.put("title", "Cake");
        body.put("description", "Custom cake");
        body.put("neededAt", Instant.now().plusSeconds(86400).toString());
        body.put("deliveryCity", "HCM");
        body.put("deliveryDistrict", "D1");
        doThrow(BusinessException.unavailable()).when(bakery).quote(any());
        mvc.perform(
                        post("/api/v1/cake-requests")
                                .with(user(customer, "CUSTOMER"))
                                .contentType("application/json")
                                .content(json.writeValueAsString(body)))
                .andExpect(status().isServiceUnavailable());
        assertEquals(
                0, jdbc.sql("select count(*) from cake_requests").query(Integer.class).single());
    }

    @Test
    @DisplayName("Orphan cleanup preserves referenced objects and recent uploads")
    void cleanOrphans_oldUnreferencedOnly_areDeleted() throws Exception {
        UUID request = create();
        byte[] bytes = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
        mvc.perform(
                        multipart("/api/v1/cake-requests/" + request + "/images")
                                .file(
                                        new MockMultipartFile(
                                                "files", "cake.png", "image/png", bytes))
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isCreated());
        String referenced =
                jdbc.sql("select object_key from request_images").query(String.class).single();
        when(storage.scan(100))
                .thenReturn(
                        List.of(
                                new ImageStorage.StoredObject(
                                        referenced, Instant.now().minusSeconds(172800)),
                                new ImageStorage.StoredObject(
                                        "marketplace/requests/old-orphan.png",
                                        Instant.now().minusSeconds(172800)),
                                new ImageStorage.StoredObject(
                                        "marketplace/requests/recent.png", Instant.now())));
        imageService.cleanOrphans();
        verify(storage).delete("marketplace/requests/old-orphan.png");
        verify(storage, never()).delete(referenced);
        verify(storage, never()).delete("marketplace/requests/recent.png");
    }

    @Test
    @DisplayName("Publishing during an upload prevents metadata commit and compensates the object")
    void images_publishDuringUpload_compensatesObject() throws Exception {
        UUID request = create();
        doAnswer(
                        call -> {
                            mvc.perform(
                                            post("/api/v1/cake-requests/" + request + "/publish")
                                                    .with(user(customer, "CUSTOMER")))
                                    .andExpect(status().isOk());
                            return null;
                        })
                .when(storage)
                .upload(any(), any(), any());
        byte[] bytes = {(byte) 255, (byte) 216, (byte) 255};
        mvc.perform(
                        multipart("/api/v1/cake-requests/" + request + "/images")
                                .file(
                                        new MockMultipartFile(
                                                "files", "cake.jpg", "image/jpeg", bytes))
                                .with(user(customer, "CUSTOMER")))
                .andExpect(status().isConflict());
        assertEquals(
                0, jdbc.sql("select count(*) from request_images").query(Integer.class).single());
        verify(storage).delete(any());
    }

    @Test
    @DisplayName("Accept racing cancellation cannot leave an accepted order on a cancelled request")
    void acceptOffer_concurrentCancel_onlyOneTransitionWins() throws Exception {
        UUID request = open(), selected = offer(request);
        var pool = java.util.concurrent.Executors.newFixedThreadPool(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        try {
            var accept =
                    pool.submit(
                            () -> {
                                start.await();
                                return accept(selected, "accept-cancel", address)
                                        .andReturn()
                                        .getResponse()
                                        .getStatus();
                            });
            var cancel =
                    pool.submit(
                            () -> {
                                start.await();
                                return mvc.perform(
                                                post("/api/v1/cake-requests/" + request + "/cancel")
                                                        .with(user(customer, "CUSTOMER"))
                                                        .contentType("application/json")
                                                        .content("{}"))
                                        .andReturn()
                                        .getResponse()
                                        .getStatus();
                            });
            start.countDown();
            var results = List.of(accept.get(), cancel.get());
            assertEquals(1, results.stream().filter(status -> status == 200).count());
            assertTrue(results.contains(409));
            String state =
                    jdbc.sql("select status from cake_requests where id=:id")
                            .param("id", request)
                            .query(String.class)
                            .single();
            assertTrue(Set.of("CANCELLED", "OFFER_SELECTED").contains(state));
            int accepted =
                    jdbc.sql(
                                    "select count(*) from offers where cake_request_id=:id and"
                                            + " status='ACCEPTED'")
                            .param("id", request)
                            .query(Integer.class)
                            .single();
            assertEquals(state.equals("CANCELLED") ? 0 : 1, accepted);
        } finally {
            pool.shutdownNow();
        }
    }
}
