package com.se193262.bakeryservice.feature.product;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.addon.dto.AddOnDto;
import com.se193262.bakeryservice.feature.addon.service.AddOnService;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;
import com.se193262.bakeryservice.feature.category.service.ProductCategoryService;
import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.entity.SelectionType;
import com.se193262.bakeryservice.feature.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class BakeryCatalogIntegrationTests {

    @Autowired BakeryService bakeryService;
    @Autowired ProductCategoryService categoryService;
    @Autowired AddOnService addOnService;
    @Autowired BakeryMemberService memberService;
    @Autowired ProductService productService;

    @Test
    void managesCatalogOptionsAndMemberGuard() {
        UUID bakeryId = bakeryService.create(new BakeryDto(null, "Catalog Bakery", null,
                "+84901112224", null, null, null), UUID.randomUUID()).id();
        ProductCategoryDto category = categoryService.create(bakeryId,
                new ProductCategoryDto(null, "Cakes", "cakes", 1, true));
        AddOnDto addOn = addOnService.create(bakeryId,
                new AddOnDto(null, "Candles", null, "Decor", BigDecimal.TEN, true));
        ProductDto product = productService.create(bakeryId,
                new ProductDto(null, category.id(), "Birthday Cake", "birthday-cake", null,
                        BigDecimal.valueOf(450000), null, true, 10, 24));

        assertThat(product.status()).isEqualTo(ProductStatus.DRAFT);
        assertThat(productService.list(bakeryId, null, null, null, 1, 20).meta().total()).isEqualTo(1);
        assertThat(productService.list(bakeryId, ProductStatus.DRAFT, category.id(), "birthday", 1, 20)
                .result()).extracting(ProductDto::id).containsExactly(product.id());

        ProductOptionsDto first = productService.replaceOptions(bakeryId, product.id(),
                new ProductOptionsDto(List.of(new ProductOptionsDto.Group(null, "Size",
                        SelectionType.SINGLE, true, 1, 1, 1,
                        List.of(new ProductOptionsDto.Value(null, "Large", null,
                                BigDecimal.valueOf(120000), true, 1))))));
        UUID groupId = first.groups().getFirst().id();
        UUID valueId = first.groups().getFirst().values().getFirst().id();
        assertThat(groupId).isNotNull();
        assertThat(valueId).isNotNull();

        ProductOptionsDto replaced = productService.replaceOptions(bakeryId, product.id(),
                new ProductOptionsDto(List.of(new ProductOptionsDto.Group(groupId, "Cake size",
                        SelectionType.SINGLE, true, 1, 1, 1,
                        List.of(new ProductOptionsDto.Value(valueId, "Extra large", null,
                                BigDecimal.valueOf(150000), true, 1))))));
        assertThat(replaced.groups().getFirst().id()).isEqualTo(groupId);
        assertThat(replaced.groups().getFirst().values().getFirst().id()).isEqualTo(valueId);
        assertThat(replaced.groups().getFirst().values().getFirst().name()).isEqualTo("Extra large");

        assertThatThrownBy(() -> productService.replaceOptions(bakeryId, product.id(),
                new ProductOptionsDto(List.of(new ProductOptionsDto.Group(UUID.randomUUID(), "Foreign",
                        SelectionType.SINGLE, false, 0, 1, 0, List.of())))))
                .isInstanceOf(AppException.class);

        assertThat(memberService.list(bakeryId))
                .extracting(BakeryMemberDto::memberRole).containsExactly(BakeryMemberRole.OWNER);

        addOnService.delete(bakeryId, addOn.id());
        assertThat(addOnService.list(bakeryId).getFirst().active()).isFalse();
        categoryService.delete(bakeryId, category.id());
        assertThat(categoryService.list(bakeryId)).isEmpty();
        assertThat(productService.list(bakeryId, null, null, null, 1, 20)
                .result().getFirst().categoryId()).isNull();
    }
}
