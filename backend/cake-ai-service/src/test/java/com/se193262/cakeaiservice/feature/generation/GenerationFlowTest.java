package com.se193262.cakeaiservice.feature.generation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import com.se193262.cakeaiservice.feature.generation.dto.*;
import com.se193262.cakeaiservice.feature.design.DesignService;
import com.se193262.cakeaiservice.infrastructure.client.*;
import com.se193262.cakeaiservice.infrastructure.storage.*;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.concurrent.*;
import javax.imageio.ImageIO;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class GenerationFlowTest {
    @Container static final PostgreSQLContainer database = new PostgreSQLContainer("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", database::getJdbcUrl);
        properties.add("spring.datasource.username", database::getUsername);
        properties.add("spring.datasource.password", database::getPassword);
    }
    @Autowired GenerationService service;
    @Autowired GenerationQueue queue;
    @Autowired GenerationWorker worker;
    @Autowired GenerationRepository repository;
    @Autowired DesignService designs;
    @Autowired JdbcClient jdbc;
    @Autowired MockMvc mvc;
    @MockitoBean MarketplaceClient marketplace;
    @MockitoBean ImageProvider provider;
    @MockitoBean ImageStorage storage;
    final UUID customerId = UUID.randomUUID(), requestId = UUID.randomUUID();
    Map<String, byte[]> objects;
    ImageValidator.Image image;

    @BeforeEach void prepare() throws Exception {
        jdbc.sql("truncate generation_jobs cascade").update();
        objects = new ConcurrentHashMap<>();
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", output);
        image = new ImageValidator().validate(output.toByteArray());
        when(provider.moderate(anyString(), anyList())).thenReturn(ImageProvider.Moderation.APPROVED);
        when(provider.generate(anyString(), anyString(), anyString(), anyList())).thenReturn(image);
        doAnswer(call -> { objects.put(call.getArgument(0), call.getArgument(1)); return null; })
                .when(storage).upload(anyString(), any(), anyString());
        when(storage.read(anyString())).thenAnswer(call -> objects.get(call.getArgument(0)));
        when(storage.signedUrl(anyString())).thenReturn("https://test.invalid/signed");
        doAnswer(call -> { objects.remove(call.getArgument(0)); return null; }).when(storage).delete(anyString());
        actor(customerId, "CUSTOMER");
    }
    @AfterEach void clearActor() { SecurityContextHolder.clearContext(); }

    @Test @DisplayName("Job generates approved images and preserves immutable replay")
    void create_success_generatesApprovedDesign() {
        var first = create("create");
        assertEquals("QUEUED", first.status());
        worker.run(queue.claim().orElseThrow());
        var detail = service.detail(first.id());
        assertEquals("SUCCEEDED", detail.job().status());
        assertEquals(1, detail.generatedDesigns().size());
        assertEquals("APPROVED", detail.generatedDesigns().getFirst().moderationStatus());
        assertNotNull(detail.generatedDesigns().getFirst().imageUrl());
        assertEquals(first, create("create"));
        assertEquals(1L, jdbc.sql("select count(*) from generation_jobs").query(Long.class).single());
    }

    @Test @DisplayName("Different payload with the same key conflicts")
    void create_changedPayload_conflicts() {
        create("key");
        assertThrows(BusinessException.class, () -> service.create(new CreateGenerationJobRequest(
                requestId, "different", null, null), List.of(), "key"));
    }

    @Test @DisplayName("Invalid image content is rejected before upload")
    void create_invalidImage_rejectsUpload() {
        var file = new MockMultipartFile("sourceImages", "cake.png", "image/png", new byte[]{1, 2, 3});
        assertThrows(BusinessException.class, () -> service.create(command(), List.of(file), "bad"));
        verify(storage, never()).upload(anyString(), any(), anyString());
    }

    @Test @DisplayName("Rejected inputs never invoke image generation")
    void run_rejectedInput_failsWithoutGeneration() {
        when(provider.moderate(anyString(), anyList())).thenReturn(ImageProvider.Moderation.REJECTED);
        var job = create("blocked");
        worker.run(queue.claim().orElseThrow());
        assertEquals("INPUT_REJECTED", service.detail(job.id()).job().errorMessage());
        verify(provider, never()).generate(anyString(), anyString(), anyString(), anyList());
    }

    @Test @DisplayName("Unknown output moderation hides URLs while preserving generated image")
    void run_uncertainOutput_keepsPending() {
        when(provider.moderate(anyString(), anyList())).thenReturn(ImageProvider.Moderation.APPROVED, ImageProvider.Moderation.PENDING);
        var job = create("pending");
        worker.run(queue.claim().orElseThrow());
        var design = service.detail(job.id()).generatedDesigns().getFirst();
        assertEquals("PENDING", design.moderationStatus());
        assertNull(design.imageUrl());
        assertNull(design.thumbnailUrl());
        assertEquals("SUCCEEDED", service.detail(job.id()).job().status());
        actor(UUID.randomUUID(), "ADMIN");
        assertEquals("APPROVED", designs.moderate(design.id(), "APPROVED").moderationStatus());
        assertThrows(BusinessException.class, () -> designs.moderate(design.id(), "REJECTED"));
    }

    @Test @DisplayName("Cancel during provider call discards late output")
    void run_cancelledDuringGeneration_doesNotPublish() {
        var job = create("cancel");
        when(provider.generate(anyString(), anyString(), anyString(), anyList())).thenAnswer(call -> {
            service.cancel(job.id()); return image;
        });
        worker.run(queue.claim().orElseThrow());
        assertEquals("CANCELLED", service.detail(job.id()).job().status());
        assertTrue(repository.designs(job.id()).isEmpty());
        assertTrue(objects.isEmpty());
    }

    @Test @DisplayName("Expired execution is failed and stale claim cannot publish")
    void recover_expiredLease_fencesLateResults() {
        var job = create("expired");
        var execution = queue.claim().orElseThrow();
        jdbc.sql("update generation_executions set lease_until=now()-interval '1 second'").update();
        queue.recoverExpired();
        assertFalse(queue.active(execution));
        assertFalse(queue.complete(execution, List.of()));
        assertEquals("EXECUTION_LEASE_EXPIRED", service.detail(job.id()).job().errorMessage());
    }

    @Test @DisplayName("Refinement preserves old design when new generation fails")
    void revise_providerFailure_keepsOldDesign() {
        var job = create("first"); worker.run(queue.claim().orElseThrow());
        var revision = new CreatePromptRevisionRequest("Darker pink flowers", null, null);
        var queued = service.revise(job.id(), revision, "revision");
        assertEquals(2, queued.currentRevision());
        assertEquals(queued, service.revise(job.id(), revision, "revision"));
        when(provider.generate(anyString(), anyString(), anyString(), anyList()))
                .thenThrow(new ProviderException("PROVIDER_RESULT_UNKNOWN"));
        worker.run(queue.claim().orElseThrow());
        assertEquals("FAILED", service.detail(job.id()).job().status());
        assertEquals(1, repository.designs(job.id()).size());
        verify(provider).generate(anyString(), contains("Darker pink"), anyString(), argThat(list -> list.size() == 1));
    }

    @Test @DisplayName("Concurrent workers cannot claim the same execution")
    void claim_concurrentWorkers_onlyOneClaim() throws Exception {
        create("one");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(List.of(queue::claim, queue::claim));
            assertEquals(1, results.stream().filter(result -> {
                try { return ((Optional<?>) result.get()).isPresent(); }
                catch (Exception error) { throw new RuntimeException(error); }
            }).count());
        }
    }

    @Test @DisplayName("Upload failure compensates previously uploaded objects")
    void run_thumbnailUploadFailure_cleansAllObjects() {
        var job = create("storage");
        doThrow(BusinessException.unavailable()).when(storage).upload(startsWith("cake-ai/thumbnails/"), any(), anyString());
        worker.run(queue.claim().orElseThrow());
        assertEquals("FAILED", service.detail(job.id()).job().status());
        assertTrue(objects.isEmpty());
        assertTrue(repository.designs(job.id()).isEmpty());
    }

    @Test @DisplayName("Ownership guards job and design access")
    void detail_otherCustomer_forbidden() {
        var job = create("owner"); worker.run(queue.claim().orElseThrow());
        UUID designId = repository.designs(job.id()).getFirst().id();
        actor(UUID.randomUUID(), "CUSTOMER");
        assertThrows(BusinessException.class, () -> service.detail(job.id()));
        assertThrows(BusinessException.class, () -> designs.get(designId));
    }

    @Test @DisplayName("HTTP routes require user JWT and idempotency header")
    void api_missingCredentialOrHeader_rejects() throws Exception {
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/v1/generation-jobs")).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/v1/generation-jobs")
                .file(new MockMultipartFile("metadata", "", "application/json",
                        ("{\"cakeRequestId\":\"" + requestId + "\",\"prompt\":\"cake\"}").getBytes()))
                .with(jwt().jwt(token -> token.subject(customerId.toString()).claim("token_type", "user"))
                        .authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("Concurrent duplicate creates persist a single job")
    void create_concurrentSameKey_returnsOneJob() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<UUID> task = () -> {
                actor(customerId, "CUSTOMER");
                try { return create("concurrent").id(); }
                finally { SecurityContextHolder.clearContext(); }
            };
            var results = executor.invokeAll(List.of(task, task));
            assertEquals(results.getFirst().get(), results.getLast().get());
            assertEquals(1L, jdbc.sql("select count(*) from generation_jobs").query(Long.class).single());
        }
    }

    @Test @DisplayName("Source URLs become available only after input approval")
    void run_sourceModeration_controlsSignedUrls() {
        var file = new MockMultipartFile("sourceImages", "cake.png", "image/png", image.bytes());
        var job = service.create(command(), List.of(file), "source");
        assertTrue(service.detail(job.id()).sourceImages().isEmpty());
        worker.run(queue.claim().orElseThrow());
        assertEquals(1, service.detail(job.id()).sourceImages().size());
    }

    @Test @DisplayName("Composite constraint prevents design from referencing a different job revision")
    void complete_crossJobRevision_rollsBack() {
        var first = create("first");
        var firstExecution = queue.claim().orElseThrow();
        var second = create("second");
        var revision = repository.revisions(second.id()).getFirst();
        var invalid = new GenerationData.Design(UUID.randomUUID(), first.id(), revision.id(), firstExecution.id(),
                "cake-ai/designs/test", null, "image/png", 1L, 1, 1, "APPROVED", "test", java.time.Instant.now());
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> queue.complete(firstExecution, List.of(invalid)));
        assertTrue(repository.designs(first.id()).isEmpty());
        assertTrue(queue.active(firstExecution));
    }

    @Test @DisplayName("Active and referenced objects are excluded from orphan cleanup")
    void cleanup_activeOrReferenced_preservesObjects() {
        var job = create("cleanup");
        assertTrue(queue.isReferencedOrActive("cake-ai/designs/" + job.id() + "/temporary"));
        service.cancel(job.id());
        assertFalse(queue.isReferencedOrActive("cake-ai/designs/" + job.id() + "/temporary"));
        assertTrue(queue.isReferencedOrActive("marketplace/requests/" + job.id() + "/image"));
    }

    private CreateGenerationJobRequest command() { return new CreateGenerationJobRequest(requestId, "Pink cake", null, null); }
    private GenerationJobResponse create(String key) { return service.create(command(), List.of(), key); }
    static void actor(UUID id, String role) {
        var token = Jwt.withTokenValue("test").header("alg", "RS256").subject(id.toString()).claim("token_type", "user").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
