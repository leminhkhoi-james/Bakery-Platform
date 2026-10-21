package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import com.se193262.bakeryservice.feature.addon.repository.AddOnRepository;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.entity.ServiceArea;
import com.se193262.bakeryservice.feature.bakery.repository.ServiceAreaRepository;
import com.se193262.bakeryservice.feature.catalog.dto.CatalogQuoteRequest;
import com.se193262.bakeryservice.feature.catalog.service.CatalogQuoteService;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionGroupRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionValueRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogQuoteServiceTest {
    private final UUID bakeryId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID addOnId = UUID.randomUUID();

    @Mock private ProductRepository productRepository;
    @Mock private ProductOptionGroupRepository groupRepository;
    @Mock private ProductOptionValueRepository valueRepository;
    @Mock private AddOnRepository addOnRepository;
    @Mock private ServiceAreaRepository areaRepository;
    @Mock private SubscriptionEntitlementClient entitlementClient;
    @InjectMocks private CatalogQuoteService quoteService;

    @BeforeEach
    void setUp() {
        Bakery bakery = new Bakery("Sweet Home", "0900000000", null);
        ReflectionTestUtils.setField(bakery, "id", bakeryId);
        bakery.submitForApproval();
        bakery.changeStatus(BakeryStatus.ACTIVE);
        Product product = new Product(bakery, null, "Cake", "cake", new BigDecimal("450000.00"));
        ReflectionTestUtils.setField(product, "id", productId);
        product.publish();
        ServiceArea area = new ServiceArea(bakery, "Ho Chi Minh City", "District 1");
        area.update("Ho Chi Minh City", "District 1", new BigDecimal("30000.00"),
                new BigDecimal("200000.00"), true);
        when(productRepository.findByIdAndBakery_Id(productId, bakeryId)).thenReturn(Optional.of(product));
        when(entitlementClient.hasActiveSubscription(bakeryId)).thenReturn(true);
        when(areaRepository.findAllByBakery_Id(bakeryId)).thenReturn(List.of(area));
        when(valueRepository.findAllByOptionGroup_Product_Id(productId)).thenReturn(List.of());
        when(groupRepository.findAllByProduct_IdOrderByDisplayOrderAsc(productId)).thenReturn(List.of());
    }

    @Test
    @DisplayName("Quote snapshots cake and add-on prices and adds the delivery fee")
    void quote_withCakeAndAddOn_calculatesTotal() {
        when(addOnRepository.findByIdAndBakery_Id(addOnId, bakeryId)).thenReturn(Optional.of(
                newAddOn()));
        var quote = quoteService.quote(new CatalogQuoteRequest(bakeryId, productId, 2,
                List.of(), List.of(new CatalogQuoteRequest.AddOnSelection(addOnId, 2)),
                "District 1", "Ho Chi Minh City"));
        assertThat(quote.subtotal()).isEqualByComparingTo("940000.00");
        assertThat(quote.deliveryFee()).isEqualByComparingTo("30000.00");
        assertThat(quote.totalAmount()).isEqualByComparingTo("970000.00");
        assertThat(quote.items()).extracting(item -> item.itemType())
                .containsExactly("CAKE", "ADD_ON");
    }

    @Test
    @DisplayName("Duplicate add-on selections are rejected")
    void quote_withDuplicateAddOn_isRejected() {
        when(addOnRepository.findByIdAndBakery_Id(addOnId, bakeryId)).thenReturn(Optional.of(
                newAddOn()));
        var request = new CatalogQuoteRequest(bakeryId, productId, 1, List.of(),
                List.of(new CatalogQuoteRequest.AddOnSelection(addOnId, 1),
                        new CatalogQuoteRequest.AddOnSelection(addOnId, 1)),
                "District 1", "Ho Chi Minh City");
        assertThatThrownBy(() -> quoteService.quote(request)).isInstanceOf(AppException.class);
    }

    private AddOn newAddOn() {
        Bakery bakery = new Bakery("Sweet Home", "0900000000", null);
        AddOn addOn = new AddOn(bakery, "Candle", "CANDLE", new BigDecimal("20000.00"));
        ReflectionTestUtils.setField(addOn, "id", addOnId);
        return addOn;
    }
}
