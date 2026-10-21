package com.se193262.bakeryservice.feature.product.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import com.se193262.bakeryservice.feature.category.repository.ProductCategoryRepository;
import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionGroup;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionValue;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.entity.SelectionType;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionGroupRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionValueRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
import com.se193262.bakeryservice.feature.product.service.ProductService;
import com.se193262.bakeryservice.shared.dto.PageResult;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final BakeryRepository bakeryRepository;
    private final ProductOptionGroupRepository groupRepository;
    private final ProductOptionValueRepository valueRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              ProductCategoryRepository categoryRepository,
                              BakeryRepository bakeryRepository,
                              ProductOptionGroupRepository groupRepository,
                              ProductOptionValueRepository valueRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.bakeryRepository = bakeryRepository;
        this.groupRepository = groupRepository;
        this.valueRepository = valueRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<ProductDto> list(UUID bakeryId, ProductStatus status, UUID categoryId,
                                       String query, int page, int size) {
        findBakery(bakeryId);
        if (page < 1 || size < 1 || size > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "page must be >= 1 and size must be 1..100");
        }
        return PageResult.fromPage(productRepository.findManagement(bakeryId, status, categoryId,
                query == null ? "" : query.trim(),
                PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(ProductDto::fromEntity));
    }

    @Override
    @Transactional
    public ProductDto create(UUID bakeryId, ProductDto request) {
        rejectServerFields(request);
        Bakery bakery = findBakery(bakeryId);
        ProductCategory category = resolveCategory(bakeryId, request.categoryId());
        String name = required(request.name(), "name");
        String slug = required(request.slug(), "slug");
        BigDecimal price = requiredPrice(request.basePrice());
        validateNumbers(request.defaultServingSize(), request.minimumNoticeHours());
        if (productRepository.existsByBakery_IdAndSlug(bakeryId, slug)) {
            throw new AppException(HttpStatus.CONFLICT, "Product slug already exists");
        }
        Product product = new Product(bakery, category, name, slug, price);
        product.updateDetails(null, null, request.description(), null, request.customizable(),
                request.defaultServingSize(), request.minimumNoticeHours());
        return ProductDto.fromEntity(productRepository.saveAndFlush(product));
    }

    @Override
    @Transactional
    public ProductDto update(UUID bakeryId, UUID productId, ProductDto request) {
        rejectServerFields(request);
        Product product = productRepository.findByIdAndBakery_Id(productId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (request.categoryId() != null) {
            product.updateCategory(resolveCategory(bakeryId, request.categoryId()));
        }
        String slug = request.slug() == null ? null : required(request.slug(), "slug");
        if (slug != null && productRepository.existsByBakery_IdAndSlugAndIdNot(bakeryId, slug, productId)) {
            throw new AppException(HttpStatus.CONFLICT, "Product slug already exists");
        }
        validateNumbers(request.defaultServingSize(), request.minimumNoticeHours());
        product.updateDetails(request.name() == null ? null : required(request.name(), "name"), slug,
                request.description(), request.basePrice() == null ? null : requiredPrice(request.basePrice()),
                request.customizable(), request.defaultServingSize(), request.minimumNoticeHours());
        productRepository.flush();
        return ProductDto.fromEntity(product);
    }

    @Override
    @Transactional
    public ProductOptionsDto replaceOptions(UUID bakeryId, UUID productId, ProductOptionsDto request) {
        productRepository.findByIdAndBakery_Id(productId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (request == null || request.groups() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "groups is required");
        }

        Map<UUID, ProductOptionGroup> existingGroups = new HashMap<>();
        groupRepository.findAllByProduct_IdOrderByDisplayOrderAsc(productId)
                .forEach(group -> existingGroups.put(group.getId(), group));
        Map<UUID, ProductOptionValue> existingValues = new HashMap<>();
        valueRepository.findAllByOptionGroup_Product_Id(productId)
                .forEach(value -> existingValues.put(value.getId(), value));
        Set<UUID> retainedGroupIds = new HashSet<>();
        Set<UUID> retainedValueIds = new HashSet<>();

        for (ProductOptionsDto.Group group : request.groups()) {
            validateGroup(group);
            if (group.id() != null && (!existingGroups.containsKey(group.id())
                    || !retainedGroupIds.add(group.id()))) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Option group ID is duplicated or belongs to another product");
            }
            for (ProductOptionsDto.Value value : group.values()) {
                validateValue(value);
                if (value.id() != null && (!existingValues.containsKey(value.id())
                        || !retainedValueIds.add(value.id()))) {
                    throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "Option value ID is duplicated or belongs to another product");
                }
            }
        }

        Product product = productRepository.getReferenceById(productId);
        List<ProductOptionGroup> savedGroups = new ArrayList<>();
        for (ProductOptionsDto.Group input : request.groups()) {
            ProductOptionGroup group = input.id() == null
                    ? new ProductOptionGroup(product, input.name().trim(), input.selectionType())
                    : existingGroups.get(input.id());
            group.update(input.name().trim(), input.selectionType(), input.required(),
                    input.minimumSelections(), input.maximumSelections(), order(input.displayOrder()));
            savedGroups.add(groupRepository.saveAndFlush(group));
        }

        List<List<ProductOptionValue>> savedValues = new ArrayList<>();
        for (int i = 0; i < request.groups().size(); i++) {
            List<ProductOptionValue> groupValues = new ArrayList<>();
            for (ProductOptionsDto.Value input : request.groups().get(i).values()) {
                ProductOptionValue value = input.id() == null
                        ? new ProductOptionValue(savedGroups.get(i), input.name().trim(),
                                input.priceAdjustment())
                        : existingValues.get(input.id());
                value.update(savedGroups.get(i), input.name().trim(), input.description(),
                        input.priceAdjustment(), input.active(), order(input.displayOrder()));
                groupValues.add(valueRepository.save(value));
            }
            savedValues.add(groupValues);
        }
        valueRepository.flush();
        existingValues.values().stream().filter(value -> !retainedValueIds.contains(value.getId()))
                .forEach(valueRepository::delete);
        valueRepository.flush();
        existingGroups.values().stream().filter(group -> !retainedGroupIds.contains(group.getId()))
                .forEach(groupRepository::delete);
        groupRepository.flush();

        List<ProductOptionsDto.Group> responseGroups = new ArrayList<>();
        for (int i = 0; i < savedGroups.size(); i++) {
            responseGroups.add(ProductOptionsDto.Group.fromEntity(savedGroups.get(i), savedValues.get(i)));
        }
        return new ProductOptionsDto(responseGroups);
    }

    private static void validateGroup(ProductOptionsDto.Group group) {
        if (group == null || group.name() == null || group.name().isBlank()
                || group.name().length() > 120 || group.selectionType() == null
                || group.required() == null || group.minimumSelections() == null
                || group.maximumSelections() == null || group.values() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Option group fields are required");
        }
        if (group.minimumSelections() < 0 || group.maximumSelections() < group.minimumSelections()
                || (group.required() && group.minimumSelections() < 1)
                || (group.selectionType() == SelectionType.SINGLE && group.maximumSelections() > 1)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid option selection range");
        }
    }

    private static void validateValue(ProductOptionsDto.Value value) {
        if (value == null || value.name() == null || value.name().isBlank()
                || value.name().length() > 120 || value.priceAdjustment() == null
                || value.active() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Option value fields are required");
        }
    }

    private static int order(Integer value) {
        return value == null ? 0 : value;
    }

    private Bakery findBakery(UUID bakeryId) {
        return bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
    }

    private ProductCategory resolveCategory(UUID bakeryId, UUID categoryId) {
        if (categoryId == null) return null;
        ProductCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getBakery().getId().equals(bakeryId)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Category belongs to another bakery");
        }
        return category;
    }

    private static void rejectServerFields(ProductDto request) {
        if (request == null || request.id() != null || request.status() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "id and status are read-only");
        }
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static BigDecimal requiredPrice(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "basePrice must be non-negative");
        }
        return value;
    }

    private static void validateNumbers(Integer servingSize, Integer noticeHours) {
        if (servingSize != null && servingSize <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "defaultServingSize must be positive");
        }
        if (noticeHours != null && noticeHours < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "minimumNoticeHours must be non-negative");
        }
    }
}
