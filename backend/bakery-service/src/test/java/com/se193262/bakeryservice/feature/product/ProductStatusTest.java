package com.se193262.bakeryservice.feature.product;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductStatusTest {
    @Test
    @DisplayName("Published products can be hidden and republished; archived products cannot")
    void publish_enforcesLifecycle() {
        Product product = new Product(new Bakery("Bakery", "0900000000", null),
                null, "Cake", "cake", BigDecimal.TEN);
        product.publish();
        product.hide();
        product.publish();
        product.archive();
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ARCHIVED);
        assertThatThrownBy(product::publish).isInstanceOf(IllegalStateException.class);
    }
}
