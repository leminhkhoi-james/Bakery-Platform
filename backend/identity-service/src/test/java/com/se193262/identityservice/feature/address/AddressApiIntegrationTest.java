package com.se193262.identityservice.feature.address;

import com.se193262.identityservice.AbstractPostgresIntegrationTest;
import com.se193262.identityservice.feature.address.dto.SaveAddressRequest;
import com.se193262.identityservice.feature.authentication.AuthenticationService;
import com.se193262.identityservice.feature.authentication.dto.RegisterRequest;
import com.se193262.identityservice.feature.user.UserContextService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import java.util.UUID;
import java.util.concurrent.Executors;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AddressApiIntegrationTest extends AbstractPostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AuthenticationService authentication;
    @Autowired AddressService addresses;
    @Autowired UserContextService context;
    UUID customer;

    @BeforeEach
    void registerCustomer() {
        customer = authentication.register(new RegisterRequest(UUID.randomUUID()+"@example.test",
                UUID.randomUUID().toString(), "Synthetic Customer", "QA-ONLY")).id();
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor user(UUID id) {
        return jwt().jwt(j -> j.subject(id.toString()).claim("token_type", "user"));
    }

    private SaveAddressRequest request(boolean primary) {
        return new SaveAddressRequest("Test", "QA recipient", "QA-ONLY", "TEST KITCHEN",
                "QA Ward", "QA District", "QA City", null, null, primary);
    }

    @Test @DisplayName("Address CRUD returns a stable server UUID and internal Order-compatible contract")
    void crud_ownedAddress_roundTripsAndDeletes() throws Exception {
        String response = mvc.perform(post("/api/v1/users/me/addresses").with(user(customer))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request(true))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isDefault").value(true))
                .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(json.readTree(response).path("data").path("id").asString());
        mvc.perform(get("/api/v1/users/me/addresses").with(user(customer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].id").value(id.toString()));
        mvc.perform(patch("/api/v1/users/me/addresses/"+id).with(user(customer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"addressLine\":\"UPDATED TEST KITCHEN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id.toString()))
                .andExpect(jsonPath("$.data.recipientName").value("QA recipient"));
        assertEquals(id, context.address(customer,id).get("id"));
        assertEquals("Test", context.address(customer,id).get("label"));
        assertEquals("UPDATED TEST KITCHEN", context.address(customer,id).get("addressLine"));
        mvc.perform(delete("/api/v1/users/me/addresses/"+id).with(user(customer))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/users/me/addresses/"+id).with(user(customer))).andExpect(status().isNotFound());
        assertThrows(com.se193262.identityservice.exception.ResourceNotFoundException.class, () -> context.address(customer,id));
    }

    @Test @DisplayName("Another user cannot read, edit, default or delete an address")
    void ownership_foreignAddress_isHidden() throws Exception {
        UUID id=addresses.create(customer,request(false)).id();
        UUID other=authentication.register(new RegisterRequest(UUID.randomUUID()+"@example.test",
                UUID.randomUUID().toString(),"Other Customer","QA-ONLY")).id();
        String path="/api/v1/users/me/addresses/"+id;
        mvc.perform(get(path).with(user(other))).andExpect(status().isNotFound());
        mvc.perform(patch(path).with(user(other)).contentType(MediaType.APPLICATION_JSON).content("{\"label\":\"Foreign\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(put(path+"/default").with(user(other))).andExpect(status().isNotFound());
        mvc.perform(delete(path).with(user(other))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/users/me/addresses").with(user(other)))
                .andExpect(jsonPath("$.data").isEmpty());
        assertThrows(com.se193262.identityservice.exception.ResourceNotFoundException.class, () -> context.address(other,id));
        assertEquals("Test",addresses.get(customer,id).label());
    }

    @Test @DisplayName("Anonymous and service tokens cannot read private user addresses")
    void security_wrongTokenType_isRejected() throws Exception {
        mvc.perform(get("/api/v1/users/me/addresses")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/users/me/addresses").with(jwt().jwt(j -> j.subject(customer.toString())
                .claim("token_type","service")))).andExpect(status().isForbidden());
    }

    @Test @DisplayName("Invalid UUID, missing fields, blank patches and out-of-range coordinates fail validation")
    void validation_invalidInput_isRejected() throws Exception {
        mvc.perform(get("/api/v1/users/me/addresses/not-a-uuid").with(user(customer))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/users/me/addresses").with(user(customer))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        UUID id=addresses.create(customer,request(false)).id();
        for (String body : new String[]{"{\"district\":\" \"}","{\"latitude\":91}","{\"longitude\":181}"}) {
            mvc.perform(patch("/api/v1/users/me/addresses/"+id).with(user(customer))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
    }

    @Test @DisplayName("Default switching serializes concurrent writes and never changes address IDs")
    void setDefault_concurrentRequests_keepsOneDefault() throws Exception {
        UUID first=addresses.create(customer,request(true)).id();
        UUID second=addresses.create(customer,request(false)).id();
        try(var executor=Executors.newFixedThreadPool(2)) {
            var a=executor.submit(() -> addresses.setDefault(customer,first));
            var b=executor.submit(() -> addresses.setDefault(customer,second));
            a.get(); b.get();
        }
        assertEquals(1,addresses.list(customer).stream().filter(a -> a.isDefault()).count());
        assertEquals(2,addresses.list(customer).size());
        mvc.perform(put("/api/v1/users/me/addresses/"+first+"/default").with(user(customer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.isDefault").value(true));
    }
}
