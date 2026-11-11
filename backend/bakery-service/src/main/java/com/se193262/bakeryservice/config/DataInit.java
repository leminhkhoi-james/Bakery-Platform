package com.se193262.bakeryservice.config;

import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import com.se193262.bakeryservice.feature.addon.repository.AddOnRepository;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryAddress;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.entity.BusinessHour;
import com.se193262.bakeryservice.feature.bakery.entity.ServiceArea;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryAddressRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BusinessHourRepository;
import com.se193262.bakeryservice.feature.bakery.repository.ServiceAreaRepository;
import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import com.se193262.bakeryservice.feature.category.repository.ProductCategoryRepository;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionGroup;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionValue;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.entity.SelectionType;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionGroupRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionValueRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
import java.util.Map;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private static final String[] SHOP_NAMES = {"Tiệm Bánh Dâu Tây", "Tiệm Bánh Cacao", "Mây Trắng Bakery", "Lò Bánh Góc Nhỏ", "Tiệm Bánh An Nhiên", "Bếp Bánh Hạnh Phúc"};
    private static final String[] OWNER_NAMES = {"Nguyễn Minh Anh", "Trần Quốc Bảo", "Lê Thu Hà", "Phạm Ngọc Linh", "Võ Hoàng Nam", "Đặng Thảo Vy"};
    private static final String[][] CAKE_NAMES = {{"Bánh kem dâu tươi", "Bánh socola hạnh nhân", "Bánh kem vani trái cây", "Mousse chanh dây"}, {"Bánh kem dâu sữa chua", "Bánh socola ganache", "Bánh vani caramel", "Mousse cà phê"}, {"Bánh kem dâu phô mai", "Bánh socola việt quất", "Bánh vani chanh vàng", "Mousse xoài"}};
    private static final String[] SHOP_DESCRIPTIONS = {"Bánh kem tươi và bánh sinh nhật trang trí theo yêu cầu. Nhận đặt bánh cho tiệc gia đình.", "Chuyên bánh socola, ganache và mousse. Có lựa chọn ít ngọt và nhiều kích thước.", "Bánh kem phong cách nhẹ nhàng, trang trí hoa và trái cây theo mùa.", "Bánh làm trong ngày, nhận viết lời chúc và thiết kế theo chủ đề của buổi tiệc.", "Bánh kem ít ngọt, cốt bông lan mềm. Nhận đơn sinh nhật và tiệc văn phòng.", "Bánh thủ công cho những dịp đặc biệt, nhận tư vấn mẫu và phối màu theo yêu cầu."};
    private static final String[] CAKE_DESCRIPTIONS = {"Cốt bông lan mềm, kem tươi ít ngọt và dâu tươi. Phù hợp tiệc sinh nhật gia đình.", "Cốt cacao đậm vị, phủ ganache socola và trang trí hạnh nhân rang.", "Bông lan vani kết hợp kem tươi và trái cây theo mùa, vị thanh nhẹ.", "Mousse mềm mịn với lớp thạch trái cây, dùng ngon hơn khi bảo quản lạnh."};
    private final BakeryRepository bakeryRepository;
    private final BakeryMemberRepository bakeryMemberRepository;
    private final BakeryAddressRepository bakeryAddressRepository;
    private final ServiceAreaRepository serviceAreaRepository;
    private final BusinessHourRepository businessHourRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductRepository productRepository;
    private final ProductOptionGroupRepository productOptionGroupRepository;
    private final ProductOptionValueRepository productOptionValueRepository;
    private final AddOnRepository addOnRepository;

    public DataInit(BakeryRepository bakeryRepository,
            BakeryMemberRepository bakeryMemberRepository,
            BakeryAddressRepository bakeryAddressRepository,
            ServiceAreaRepository serviceAreaRepository,
            BusinessHourRepository businessHourRepository,
            ProductCategoryRepository productCategoryRepository,
            ProductRepository productRepository,
            ProductOptionGroupRepository productOptionGroupRepository,
            ProductOptionValueRepository productOptionValueRepository,
            AddOnRepository addOnRepository) {
        this.bakeryRepository = bakeryRepository;
        this.bakeryMemberRepository = bakeryMemberRepository;
        this.bakeryAddressRepository = bakeryAddressRepository;
        this.serviceAreaRepository = serviceAreaRepository;
        this.businessHourRepository = businessHourRepository;
        this.productCategoryRepository = productCategoryRepository;
        this.productRepository = productRepository;
        this.productOptionGroupRepository = productOptionGroupRepository;
        this.productOptionValueRepository = productOptionValueRepository;
        this.addOnRepository = addOnRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String[] legacyNames = {"Demo Bánh Dâu", "Demo Socola", "Demo Mây Trắng", "Demo Tiệm Chờ Duyệt", "Demo Tiệm Chờ Gói", "Demo Tiệm Bản Nháp"};
        String[] districts = {"Quận 5", "Quận 1", "Bình Thạnh", "Quận 3"};
        for (int number = 1; number <= SHOP_NAMES.length; number++) {
            int seedNumber = number;
            int owner = number <= 3 ? 20 + number : 27 + number;
            String ownerName = OWNER_NAMES[number - 1];
            String email = (number <= 3 ? "shop" + number : "newshop" + (number - 3)) + "@gmail.com";
            String legacyEmail = (number <= 3 ? "owner" + number : "partner" + (number - 3)) + "@demo.test";
            bakeryRepository.findById(id(10, number)).filter(bakery -> legacyEmail.equals(bakery.getEmail()))
                    .ifPresent(bakery -> bakery.setEmail(email));
            bakeryRepository.findById(id(10, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getName(), legacyNames[seedNumber - 1])) existing.setName(SHOP_NAMES[seedNumber - 1]);
                if (java.util.Objects.equals(existing.getDescription(), "Dữ liệu mẫu để kiểm thử, không phải cửa hàng thật.")) existing.setDescription(SHOP_DESCRIPTIONS[seedNumber - 1]);
            });
            if (!bakeryRepository.existsById(id(10, number))) {
                Bakery demoBakery = new Bakery();
                demoBakery.setId(id(10, number));
                demoBakery.setName(SHOP_NAMES[number - 1]);
                demoBakery.setDescription(SHOP_DESCRIPTIONS[number - 1]);
                demoBakery.setPhoneNumber(phone(owner));
                demoBakery.setEmail(email);
                demoBakery.setStatus(BakeryStatus.valueOf(number == 4 ? "PENDING_APPROVAL" : number == 6 ? "DRAFT" : "ACTIVE"));
                bakeryRepository.save(demoBakery);
            }
            bakeryMemberRepository.findById(id(11, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getDisplayNameSnapshot(), seedNumber <= 3 ? "Chủ tiệm Demo " + seedNumber : "Đăng ký đối tác " + (seedNumber - 3))) existing.setDisplayNameSnapshot(ownerName);
            });
            if (!bakeryMemberRepository.existsById(id(11, number))) {
                BakeryMember demoBakeryMember = new BakeryMember();
                demoBakeryMember.setId(id(11, number));
                demoBakeryMember.setBakery(bakeryRepository.getReferenceById(id(10, number)));
                demoBakeryMember.setUserId(id(1, owner));
                demoBakeryMember.setMemberRole(BakeryMemberRole.valueOf("OWNER"));
                demoBakeryMember.setStatus(BakeryMemberStatus.valueOf("ACTIVE"));
                demoBakeryMember.setDisplayNameSnapshot(ownerName);
                demoBakeryMember.setOwnerActivationPending(number >= 4);
                bakeryMemberRepository.save(demoBakeryMember);
            }
            if (!bakeryAddressRepository.existsById(id(12, number))) {
                BakeryAddress demoBakeryAddress = new BakeryAddress();
                demoBakeryAddress.setId(id(12, number));
                demoBakeryAddress.setBakery(bakeryRepository.getReferenceById(id(10, number)));
                demoBakeryAddress.setAddressLine((99 + number) + " Nguyễn Trãi");
                demoBakeryAddress.setWard("Phường 4");
                demoBakeryAddress.setDistrict(districts[(number - 1) % 4]);
                demoBakeryAddress.setCity("TP. Hồ Chí Minh");
                demoBakeryAddress.setPrimary(true);
                bakeryAddressRepository.save(demoBakeryAddress);
            }
            for (int district = 0; district < districts.length; district++) {
                if (!serviceAreaRepository.existsById(id(13, (number - 1) * 4 + district + 1))) {
                    ServiceArea demoServiceArea = new ServiceArea();
                    demoServiceArea.setId(id(13, (number - 1) * 4 + district + 1));
                    demoServiceArea.setBakery(bakeryRepository.getReferenceById(id(10, number)));
                    demoServiceArea.setCity("TP. Hồ Chí Minh");
                    demoServiceArea.setDistrict(districts[district]);
                    demoServiceArea.setDeliveryFee(BigDecimal.valueOf(district == 0 ? 20000 : 30000));
                    demoServiceArea.setMinimumOrder(BigDecimal.ZERO);
                    demoServiceArea.setActive(true);
                    serviceAreaRepository.save(demoServiceArea);
                }
            }
            for (int day = 1; day <= 7; day++) {
                if (!businessHourRepository.existsById(id(14, (number - 1) * 7 + day))) {
                    BusinessHour demoBusinessHour = new BusinessHour();
                    demoBusinessHour.setId(id(14, (number - 1) * 7 + day));
                    demoBusinessHour.setBakery(bakeryRepository.getReferenceById(id(10, number)));
                    demoBusinessHour.setDayOfWeek((short) (day));
                    demoBusinessHour.setOpensAt(LocalTime.of(8, 0));
                    demoBusinessHour.setClosesAt(LocalTime.of(21, 0));
                    demoBusinessHour.setClosed(false);
                    businessHourRepository.save(demoBusinessHour);
                }
            }
        }
        String[] cakes = {"Bánh kem dâu", "Bánh socola", "Bánh vani trái cây", "Bánh mousse bản nháp"};
        for (int bakery = 1; bakery <= 3; bakery++) {
            int seedBakery = bakery;
            productCategoryRepository.findById(id(15, bakery)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getName(), "Bánh sinh nhật Demo")) existing.setName("Bánh sinh nhật");
            });
            if (!productCategoryRepository.existsById(id(15, bakery))) {
                ProductCategory demoProductCategory = new ProductCategory();
                demoProductCategory.setId(id(15, bakery));
                demoProductCategory.setBakery(bakeryRepository.getReferenceById(id(10, bakery)));
                demoProductCategory.setName("Bánh sinh nhật");
                demoProductCategory.setSlug("banh-sinh-nhat");
                demoProductCategory.setDisplayOrder(1);
                demoProductCategory.setActive(true);
                productCategoryRepository.save(demoProductCategory);
            }
            for (int index = 0; index < 4; index++) {
            int seedIndex = index;
                int product = (bakery - 1) * 4 + index + 1;
                productRepository.findById(id(16, product)).ifPresent(existing -> {
                    if (java.util.Objects.equals(existing.getName(), cakes[seedIndex] + " " + seedBakery)) existing.setName(CAKE_NAMES[seedBakery - 1][seedIndex]);
                    if (java.util.Objects.equals(existing.getDescription(), "Bánh mẫu để test chọn kích thước, phụ kiện và đặt hàng.")) existing.setDescription(CAKE_DESCRIPTIONS[seedIndex]);
                });
                if (!productRepository.existsById(id(16, product))) {
                    Product demoProduct = new Product();
                    demoProduct.setId(id(16, product));
                    demoProduct.setBakery(bakeryRepository.getReferenceById(id(10, bakery)));
                    demoProduct.setCategory(productCategoryRepository.getReferenceById(id(15, bakery)));
                    demoProduct.setName(CAKE_NAMES[bakery - 1][index]);
                    demoProduct.setSlug("banh-kem-" + product);
                    demoProduct.setDescription(CAKE_DESCRIPTIONS[index]);
                    demoProduct.setBasePrice(BigDecimal.valueOf(280000 + index * 60000L));
                    demoProduct.setStatus(ProductStatus.valueOf(index == 3 ? "DRAFT" : "PUBLISHED"));
                    demoProduct.setCustomizable(true);
                    demoProduct.setDefaultServingSize(8);
                    demoProduct.setMinimumNoticeHours(24);
                    productRepository.save(demoProduct);
                }
                if (!productOptionGroupRepository.existsById(id(18, product))) {
                    ProductOptionGroup demoProductOptionGroup = new ProductOptionGroup();
                    demoProductOptionGroup.setId(id(18, product));
                    demoProductOptionGroup.setProduct(productRepository.getReferenceById(id(16, product)));
                    demoProductOptionGroup.setName("Kích thước");
                    demoProductOptionGroup.setSelectionType(SelectionType.valueOf("SINGLE"));
                    demoProductOptionGroup.setRequired(true);
                    demoProductOptionGroup.setMinimumSelections(1);
                    demoProductOptionGroup.setMaximumSelections(1);
                    demoProductOptionGroup.setDisplayOrder(0);
                    productOptionGroupRepository.save(demoProductOptionGroup);
                }
                for (int size = 0; size < 3; size++) {
                    if (!productOptionValueRepository.existsById(id(19, (product - 1) * 3 + size + 1))) {
                        ProductOptionValue demoProductOptionValue = new ProductOptionValue();
                        demoProductOptionValue.setId(id(19, (product - 1) * 3 + size + 1));
                        demoProductOptionValue.setOptionGroup(productOptionGroupRepository.getReferenceById(id(18, product)));
                        demoProductOptionValue.setName((16 + size * 4) + " cm");
                        demoProductOptionValue.setPriceAdjustment(BigDecimal.valueOf(size * 50000L));
                        demoProductOptionValue.setActive(true);
                        demoProductOptionValue.setDisplayOrder(size);
                        productOptionValueRepository.save(demoProductOptionValue);
                    }
                }
            }
            for (int addon = 0; addon < 2; addon++) {
            int seedAddon = addon;
                addOnRepository.findById(id(20, (bakery - 1) * 2 + addon + 1)).ifPresent(existing -> {
                    if (java.util.Objects.equals(existing.getName(), seedAddon == 0 ? "Nến sinh nhật Demo" : "Thiệp chúc mừng Demo")) existing.setName(seedAddon == 0 ? "Bộ nến sinh nhật" : "Thiệp viết tay");
                });
                if (!addOnRepository.existsById(id(20, (bakery - 1) * 2 + addon + 1))) {
                    AddOn demoAddOn = new AddOn();
                    demoAddOn.setId(id(20, (bakery - 1) * 2 + addon + 1));
                    demoAddOn.setBakery(bakeryRepository.getReferenceById(id(10, bakery)));
                    demoAddOn.setName(addon == 0 ? "Bộ nến sinh nhật" : "Thiệp viết tay");
                    demoAddOn.setCategory(addon == 0 ? "DECORATION" : "CARD");
                    demoAddOn.setPrice(BigDecimal.valueOf(addon == 0 ? 20000 : 15000));
                    demoAddOn.setActive(true);
                    addOnRepository.save(demoAddOn);
                }
            }
        }
        // No object keys are invented: image uploads remain available through the normal APIs.
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 6 seed bakeries and 12 products");
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }

    private static String phone(int number) { return "090%07d".formatted(number); }
}
