package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.PatchOfferRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import static org.junit.jupiter.api.Assertions.*;

class PatchOfferRequestTest {
    @Test
    @DisplayName("Delegating patch consumes flat JSON and preserves omitted versus explicit null")
    void deserialize_flatPatch_preservesExactFields() {
        var json = JsonMapper.builder().build();
        var price = json.readValue("{\"cakePrice\":410000.25}", PatchOfferRequest.class);
        assertEquals(java.util.Set.of("cakePrice"), price.changes().keySet());
        assertEquals(410000.25, ((Number) price.changes().get("cakePrice")).doubleValue());
        var clear = json.readValue("{\"message\":null}", PatchOfferRequest.class);
        assertTrue(clear.changes().containsKey("message"));
        assertNull(clear.changes().get("message"));
        var wrapped = json.readValue("{\"changes\":{\"cakePrice\":410000}}", PatchOfferRequest.class);
        assertEquals(java.util.Set.of("changes"), wrapped.changes().keySet());
        assertFalse(wrapped.changes().containsKey("cakePrice"));
    }
}
