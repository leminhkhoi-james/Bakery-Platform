package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

public interface GenerationService {
    GenerationJobResponse create(CreateGenerationJobRequest request, List<MultipartFile> images, String key);
    GenerationJobResponse revise(UUID jobId, CreatePromptRevisionRequest request, String key);
    GenerationJobResponse cancel(UUID jobId);
    GenerationReader.JobDetail detail(UUID jobId);
    GenerationReader.JobPage list(UUID requestId, String status, int page, int size);
}
