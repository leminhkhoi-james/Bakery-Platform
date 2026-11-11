package com.se193262.cakeaiservice.config;

import com.se193262.cakeaiservice.feature.generation.GenerationExecution;
import com.se193262.cakeaiservice.feature.generation.GenerationExecutionRepository;
import com.se193262.cakeaiservice.feature.generation.GenerationJob;
import com.se193262.cakeaiservice.feature.generation.GenerationJobRepository;
import com.se193262.cakeaiservice.feature.generation.GenerationStatus;
import com.se193262.cakeaiservice.feature.generation.PromptRevision;
import com.se193262.cakeaiservice.feature.generation.PromptRevisionRepository;
import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import java.util.Map;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private static final String[] PROMPTS = {"Bánh sinh nhật chủ đề khủng long, tông xanh lá, tên bé An, phong cách đáng yêu.", "Bánh kem dâu tươi trang trí tối giản, nền kem trắng, điểm hoa nhỏ màu hồng.", "Bánh kỷ niệm ngày cưới, hoa kem trắng và hồng nhạt, phong cách thanh lịch.", "Bánh kem dâu ít ngọt, trang trí trái cây và dòng chữ chúc mừng sinh nhật."};
    private final GenerationJobRepository generationJobRepository;
    private final PromptRevisionRepository promptRevisionRepository;
    private final GenerationExecutionRepository generationExecutionRepository;

    public DataInit(GenerationJobRepository generationJobRepository,
            PromptRevisionRepository promptRevisionRepository,
            GenerationExecutionRepository generationExecutionRepository) {
        this.generationJobRepository = generationJobRepository;
        this.promptRevisionRepository = promptRevisionRepository;
        this.generationExecutionRepository = generationExecutionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Instant created = Instant.now().minus(2, ChronoUnit.HOURS);
        for (int number = 1; number <= 4; number++) {
            int seedNumber = number;
            String status = number <= 2 ? "FAILED" : "CANCELLED";
            generationJobRepository.findById(id(70, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getModelName(), "demo-fixture-no-provider")) existing.setModelName("provider-not-configured");
                if (java.util.Objects.equals(existing.getErrorMessage(), seedNumber <= 2 ? "DEMO_FIXTURE: dữ liệu mẫu, chưa gọi nhà cung cấp AI." : null)) existing.setErrorMessage(seedNumber <= 2 ? "Chưa cấu hình nhà cung cấp tạo ảnh." : null);
            });
            if (!generationJobRepository.existsById(id(70, number))) {
                GenerationJob demoGenerationJob = new GenerationJob();
                demoGenerationJob.setId(id(70, number));
                demoGenerationJob.setCustomerId(id(1, 10 + number));
                demoGenerationJob.setCakeRequestId(id(40, number));
                demoGenerationJob.setStatus(GenerationStatus.valueOf(status));
                demoGenerationJob.setModelName("provider-not-configured");
                demoGenerationJob.setGenerationParameters(new GenerationParameters("1:1", 1));
                demoGenerationJob.setErrorMessage(number <= 2 ? "Chưa cấu hình nhà cung cấp tạo ảnh." : null);
                demoGenerationJob.setStartedAt(created);
                demoGenerationJob.setCompletedAt(created.plus(1, ChronoUnit.HOURS));
                demoGenerationJob.setCreatedAt(created);
                demoGenerationJob.setUpdatedAt(Instant.now());
                generationJobRepository.save(demoGenerationJob);
            }
            promptRevisionRepository.findById(id(71, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getPromptText(), "Bánh sinh nhật màu pastel Demo " + seedNumber)) existing.setPromptText(PROMPTS[seedNumber - 1]);
            });
            if (!promptRevisionRepository.existsById(id(71, number))) {
                PromptRevision demoPromptRevision = new PromptRevision();
                demoPromptRevision.setId(id(71, number));
                demoPromptRevision.setGenerationJobId(id(70, number));
                demoPromptRevision.setRevisionNumber(1);
                demoPromptRevision.setPromptText(PROMPTS[number - 1]);
                demoPromptRevision.setCreatedBy(id(1, 10 + number));
                demoPromptRevision.setCreatedAt(created);
                promptRevisionRepository.save(demoPromptRevision);
            }
            generationExecutionRepository.findById(id(72, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getModelName(), "demo-fixture-no-provider")) existing.setModelName("provider-not-configured");
                if (java.util.Objects.equals(existing.getErrorCode(), seedNumber <= 2 ? "DEMO_FIXTURE" : null)) existing.setErrorCode(seedNumber <= 2 ? "PROVIDER_NOT_CONFIGURED" : null);
            });
            if (!generationExecutionRepository.existsById(id(72, number))) {
                GenerationExecution demoGenerationExecution = new GenerationExecution();
                demoGenerationExecution.setId(id(72, number));
                demoGenerationExecution.setGenerationJobId(id(70, number));
                demoGenerationExecution.setPromptRevisionId(id(71, number));
                demoGenerationExecution.setStatus(GenerationStatus.valueOf(status));
                demoGenerationExecution.setModelName("provider-not-configured");
                demoGenerationExecution.setGenerationParameters(new GenerationParameters("1:1", 1));
                demoGenerationExecution.setErrorCode(number <= 2 ? "PROVIDER_NOT_CONFIGURED" : null);
                demoGenerationExecution.setCreatedAt(created);
                demoGenerationExecution.setCompletedAt(created.plus(1, ChronoUnit.HOURS));
                demoGenerationExecution.setReservedProviderCalls(0);
                generationExecutionRepository.save(demoGenerationExecution);
            }
        }
        // Terminal jobs cannot be picked up by the provider scheduler.
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 4 terminal seed AI jobs; no provider calls or invented image keys");
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }

}
