package com.se193262.identityservice.feature.address;

import com.se193262.identityservice.feature.address.dto.*;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AddressServiceImpl implements AddressService {
    private final AddressRepository addresses;
    private final Validator validator;

    public AddressServiceImpl(AddressRepository addresses, Validator validator) {
        this.addresses = addresses;
        this.validator = validator;
    }

    public List<AddressResponse> list(UUID userId) {
        addresses.requireActiveUser(userId, false);
        return addresses.list(userId);
    }

    public AddressResponse get(UUID userId, UUID id) {
        addresses.requireActiveUser(userId, false);
        return addresses.get(userId, id);
    }

    @Transactional
    public AddressResponse create(UUID userId, SaveAddressRequest request) {
        validate(request);
        // Serialize all of this user's mutations, including the first default address.
        addresses.requireActiveUser(userId, true);
        if (Boolean.TRUE.equals(request.isDefault())) addresses.clearDefault(userId);
        return addresses.get(userId, addresses.create(userId, request));
    }

    @Transactional
    public AddressResponse update(UUID userId, UUID id, SaveAddressRequest patch) {
        addresses.requireActiveUser(userId, true);
        SaveAddressRequest request = patch.merge(addresses.get(userId, id));
        validate(request);
        if (Boolean.TRUE.equals(request.isDefault())) addresses.clearDefault(userId);
        addresses.update(userId, id, request);
        return addresses.get(userId, id);
    }

    @Transactional
    public AddressResponse setDefault(UUID userId, UUID id) {
        return update(userId, id, new SaveAddressRequest(null,null,null,null,null,null,null,null,null,true));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        addresses.requireActiveUser(userId, true);
        addresses.get(userId, id);
        addresses.delete(userId, id);
    }

    private void validate(SaveAddressRequest request) {
        if (!validator.validate(request, SaveAddressRequest.Create.class).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address fields are invalid");
        }
    }
}
