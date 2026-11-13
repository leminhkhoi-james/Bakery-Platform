package com.se193262.marketplaceservice.config;

import com.se193262.marketplaceservice.feature.cakerequest.CakePreference;
import com.se193262.marketplaceservice.feature.cakerequest.CakePreferenceRepository;
import com.se193262.marketplaceservice.feature.cakerequest.CakeRequest;
import com.se193262.marketplaceservice.feature.cakerequest.CakeRequestRepository;
import com.se193262.marketplaceservice.feature.cakerequest.RequestStatus;
import com.se193262.marketplaceservice.feature.cakerequest.RequestStatusHistory;
import com.se193262.marketplaceservice.feature.cakerequest.RequestStatusHistoryRepository;
import com.se193262.marketplaceservice.feature.cakerequest.RequestType;
import com.se193262.marketplaceservice.feature.offer.Offer;
import com.se193262.marketplaceservice.feature.offer.OfferRepository;
import com.se193262.marketplaceservice.feature.offer.OfferStatus;
import com.se193262.marketplaceservice.feature.offer.OfferStatusHistory;
import com.se193262.marketplaceservice.feature.offer.OfferStatusHistoryRepository;
import java.util.Map;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private static final String[] TITLES = {"Bánh sinh nhật bé An 5 tuổi", "Bánh kem dâu cho tiệc gia đình", "Bánh kỷ niệm ngày cưới", "Bánh kem dâu ít ngọt tặng bạn", "Bánh sinh nhật tặng mẹ", "Bánh chia tay đồng nghiệp", "Bánh mừng khai trương", "Bánh tốt nghiệp màu pastel"};
    private static final String[] DESCRIPTIONS = {"Bánh chủ đề khủng long, tông xanh lá, ghi tên bé An. Kem ít ngọt, đủ cho 10 người.", "Bánh dâu tươi, kem sữa, trang trí đơn giản. Giao vào buổi chiều cho tiệc gia đình.", "Bánh tông trắng và hồng nhạt, trang trí hoa nhỏ, ghi lời chúc kỷ niệm ngày cưới.", "Muốn đặt bánh kem dâu của tiệm, giảm độ ngọt và thêm dòng chữ chúc mừng sinh nhật.", "Bánh tặng mẹ, trang trí hoa màu tím nhạt. Ưu tiên vị thanh, không dùng hạt.", "Bánh cho tiệc văn phòng khoảng 10 người, trang trí trang nhã và kèm lời chúc chia tay.", "Bánh chúc mừng khai trương cửa hàng, phối đỏ và vàng, có chỗ viết tên thương hiệu.", "Bánh chúc mừng tốt nghiệp, tông xanh pastel và trắng, trang trí mũ cử nhân."};
    private final CakeRequestRepository cakeRequestRepository;
    private final CakePreferenceRepository cakePreferenceRepository;
    private final RequestStatusHistoryRepository requestStatusHistoryRepository;
    private final OfferRepository offerRepository;
    private final OfferStatusHistoryRepository offerStatusHistoryRepository;

    public DataInit(CakeRequestRepository cakeRequestRepository,
            CakePreferenceRepository cakePreferenceRepository,
            RequestStatusHistoryRepository requestStatusHistoryRepository,
            OfferRepository offerRepository,
            OfferStatusHistoryRepository offerStatusHistoryRepository) {
        this.cakeRequestRepository = cakeRequestRepository;
        this.cakePreferenceRepository = cakePreferenceRepository;
        this.requestStatusHistoryRepository = requestStatusHistoryRepository;
        this.offerRepository = offerRepository;
        this.offerStatusHistoryRepository = offerStatusHistoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Instant now = Instant.now();
        seedRequests(now);
        seedOffers(now);
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 8 seed requests and 9 offers");
    }

    private void seedRequests(Instant now) {
        String[] statuses = {"DRAFT", "OPEN", "OPEN", "OPEN", "OFFER_SELECTED", "CANCELLED", "CLOSED", "OPEN"};
        String[] districts = {"Quận 5", "Quận 1", "Bình Thạnh", "Quận 3"};
        for (int number = 1; number <= statuses.length; number++) {
            int seedNumber = number;
            int customer = 11 + (number - 1) % 6;
            boolean targeted = number == 4;
            cakeRequestRepository.findById(id(40, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getTitle(), "Yêu cầu bánh Demo " + seedNumber)) existing.setTitle(TITLES[seedNumber - 1]);
                if (java.util.Objects.equals(existing.getDescription(), "Bánh sinh nhật mẫu để kiểm thử báo giá và trao đổi với tiệm.")) existing.setDescription(DESCRIPTIONS[seedNumber - 1]);
            });
            if (!cakeRequestRepository.existsById(id(40, number))) {
                CakeRequest demoCakeRequest = new CakeRequest();
                demoCakeRequest.setId(id(40, number));
                demoCakeRequest.setCustomerId(id(1, customer));
                demoCakeRequest.setTargetBakeryId(targeted ? id(10, 2) : null);
                demoCakeRequest.setBaseProductId(targeted ? id(16, 5) : null);
                demoCakeRequest.setRequestType(RequestType.valueOf(targeted ? "TARGETED_PRODUCT_CUSTOM" : "OPEN_CUSTOM"));
                demoCakeRequest.setTitle(TITLES[number - 1]);
                demoCakeRequest.setDescription(DESCRIPTIONS[number - 1]);
                demoCakeRequest.setOccasion("Sinh nhật");
                demoCakeRequest.setServingSize(10);
                demoCakeRequest.setBudgetMin(BigDecimal.valueOf(300000));
                demoCakeRequest.setBudgetMax(BigDecimal.valueOf(800000));
                demoCakeRequest.setNeededAt(now.plus(14, ChronoUnit.DAYS));
                demoCakeRequest.setDeliveryDistrict(districts[(customer - 11) % 4]);
                demoCakeRequest.setDeliveryCity("TP. Hồ Chí Minh");
                demoCakeRequest.setStatus(RequestStatus.valueOf(statuses[number - 1]));
                demoCakeRequest.setOfferDeadline(now.plus(7, ChronoUnit.DAYS));
                demoCakeRequest.setCreatedAt(now.minus(2, ChronoUnit.DAYS));
                demoCakeRequest.setUpdatedAt(Instant.now());
                cakeRequestRepository.save(demoCakeRequest);
            }
            cakePreferenceRepository.findById(id(40, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getDecorationNotes(), "Chữ Happy Birthday Demo")) existing.setDecorationNotes("Trang trí nhẹ nhàng, viết lời chúc theo nội dung đã trao đổi.");
            });
            if (!cakePreferenceRepository.existsById(id(40, number))) {
                CakePreference demoCakePreference = new CakePreference();
                demoCakePreference.setCakeRequestId(id(40, number));
                demoCakePreference.setCakeSize("20 cm");
                demoCakePreference.setCakeShape("ROUND");
                demoCakePreference.setFlavor("Vani");
                demoCakePreference.setDecorationNotes("Trang trí nhẹ nhàng, viết lời chúc theo nội dung đã trao đổi.");
                demoCakePreference.setExtraOptions(Map.of("fixture", true));
                cakePreferenceRepository.save(demoCakePreference);
            }
            requestStatusHistoryRepository.findById(id(41, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getReason(), "Trạng thái dữ liệu mẫu")) existing.setReason("Khách hàng cập nhật yêu cầu đặt bánh.");
            });
            if (!requestStatusHistoryRepository.existsById(id(41, number))) {
                RequestStatusHistory demoRequestStatusHistory = new RequestStatusHistory();
                demoRequestStatusHistory.setId(id(41, number));
                demoRequestStatusHistory.setCakeRequestId(id(40, number));
                demoRequestStatusHistory.setToStatus(statuses[number - 1]);
                demoRequestStatusHistory.setChangedBy(id(1, customer));
                demoRequestStatusHistory.setReason("Khách hàng cập nhật yêu cầu đặt bánh.");
                demoRequestStatusHistory.setChangedAt(now.minus(1, ChronoUnit.DAYS));
                requestStatusHistoryRepository.save(demoRequestStatusHistory);
            }
        }
    }

    private void seedOffers(Instant now) {
        int[][] references = {{2, 1}, {2, 2}, {2, 3}, {3, 1}, {3, 3}, {4, 2}, {5, 1}, {5, 2}, {7, 3}};
        for (int index = 0; index < references.length; index++) {
            int number = index + 1;
            int request = references[index][0];
            int bakery = references[index][1];
            String status = number == 7 || number == 9 ? "ACCEPTED" : number == 8 ? "REJECTED" : "PENDING";
            BigDecimal price = BigDecimal.valueOf(400000 + number * 10000L);
            BigDecimal fee = BigDecimal.valueOf(20000);
            offerRepository.findById(id(42, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getMessage(), "Báo giá mẫu; không phát sinh giao dịch thật.")) existing.setMessage("Tiệm nhận làm theo yêu cầu, giá đã gồm hộp và phần trang trí cơ bản. Bạn xác nhận giúp tiệm trước ngày giao nhé.");
            });
            if (!offerRepository.existsById(id(42, number))) {
                Offer demoOffer = new Offer();
                demoOffer.setId(id(42, number));
                demoOffer.setCakeRequestId(id(40, request));
                demoOffer.setBakeryId(id(10, bakery));
                demoOffer.setMessage("Tiệm nhận làm theo yêu cầu, giá đã gồm hộp và phần trang trí cơ bản. Bạn xác nhận giúp tiệm trước ngày giao nhé.");
                demoOffer.setCakePrice(price);
                demoOffer.setDeliveryFee(fee);
                demoOffer.setAddOnTotal(BigDecimal.ZERO);
                demoOffer.setTotalPrice(price.add(fee));
                demoOffer.setEstimatedCompletionAt(now.plus(12, ChronoUnit.DAYS));
                demoOffer.setExpiresAt(now.plus(6, ChronoUnit.DAYS));
                demoOffer.setStatus(OfferStatus.valueOf(status));
                demoOffer.setCreatedAt(now.minus(1, ChronoUnit.DAYS));
                demoOffer.setUpdatedAt(Instant.now());
                offerRepository.save(demoOffer);
            }
            offerStatusHistoryRepository.findById(id(43, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getReason(), "Trạng thái dữ liệu mẫu")) existing.setReason(status.equals("PENDING") ? "Tiệm gửi báo giá cho khách." : status.equals("ACCEPTED") ? "Khách hàng đồng ý báo giá." : "Khách hàng chọn báo giá khác.");
            });
            if (!offerStatusHistoryRepository.existsById(id(43, number))) {
                OfferStatusHistory demoOfferStatusHistory = new OfferStatusHistory();
                demoOfferStatusHistory.setId(id(43, number));
                demoOfferStatusHistory.setOfferId(id(42, number));
                demoOfferStatusHistory.setToStatus(status);
                demoOfferStatusHistory.setChangedBy(id(1, status.equals("PENDING") ? 20 + bakery : 11 + (request - 1) % 6));
                demoOfferStatusHistory.setReason(status.equals("PENDING") ? "Tiệm gửi báo giá cho khách." : status.equals("ACCEPTED") ? "Khách hàng đồng ý báo giá." : "Khách hàng chọn báo giá khác.");
                demoOfferStatusHistory.setChangedAt(now.minus(1, ChronoUnit.HOURS));
                offerStatusHistoryRepository.save(demoOfferStatusHistory);
            }
        }
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }

}
