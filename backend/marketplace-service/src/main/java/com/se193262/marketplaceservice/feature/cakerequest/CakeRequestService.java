package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.shared.dto.PageResponse;

import java.util.*;

public interface CakeRequestService {
    CakeRequestResponse create(CreateCakeRequestRequest command);

    CakeRequestResponse patch(UUID id, PatchCakeRequestRequest command);

    CakeRequestResponse detail(UUID id);

    PageResponse<CakeRequestSummaryResponse> list(Map<String, String> filters);

    CakeRequestResponse publish(UUID id);

    CakeRequestResponse cancel(UUID id, String reason);

    CakeRequestResponse selectDesign(UUID id, UUID designId);

    Map<String, Object> context(UUID id);
}
