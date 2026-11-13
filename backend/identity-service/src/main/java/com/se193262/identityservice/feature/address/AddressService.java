package com.se193262.identityservice.feature.address;

import com.se193262.identityservice.feature.address.dto.*;
import java.util.List;
import java.util.UUID;

public interface AddressService {
    List<AddressResponse> list(UUID userId);
    AddressResponse get(UUID userId, UUID id);
    AddressResponse create(UUID userId, SaveAddressRequest request);
    AddressResponse update(UUID userId, UUID id, SaveAddressRequest request);
    AddressResponse setDefault(UUID userId, UUID id);
    void delete(UUID userId, UUID id);
}
