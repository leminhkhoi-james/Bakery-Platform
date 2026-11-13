package com.se193262.orderservice.config;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.CustomerOrderRepository;
import com.se193262.orderservice.feature.order.DeliveryAddressSnapshot;
import com.se193262.orderservice.feature.order.DeliveryAddressSnapshotRepository;
import com.se193262.orderservice.feature.order.OrderItem;
import com.se193262.orderservice.feature.order.OrderItemRepository;
import com.se193262.orderservice.feature.order.OrderItemType;
import com.se193262.orderservice.feature.order.OrderSource;
import com.se193262.orderservice.feature.order.OrderStatus;
import com.se193262.orderservice.feature.order.OrderStatusHistory;
import com.se193262.orderservice.feature.order.OrderStatusHistoryRepository;
import com.se193262.orderservice.feature.review.OrderReview;
import com.se193262.orderservice.feature.review.OrderReviewRepository;
import com.se193262.orderservice.feature.review.ReviewStatus;
import java.util.Map;
import java.util.List;

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
    private static final String[] CUSTOMER_NAMES = {"Nguyễn Hoàng An", "Trần Minh Khang", "Lê Ngọc Mai", "Phạm Anh Thư", "Võ Gia Huy", "Đặng Khánh Linh"};
    private static final String[] SHOP_NAMES = {"Tiệm Bánh Dâu Tây", "Tiệm Bánh Cacao", "Mây Trắng Bakery", "Lò Bánh Góc Nhỏ", "Tiệm Bánh An Nhiên", "Bếp Bánh Hạnh Phúc"};
    private static final String[][] CAKE_NAMES = {{"Bánh kem dâu tươi", "Bánh socola hạnh nhân", "Bánh kem vani trái cây", "Mousse chanh dây"}, {"Bánh kem dâu sữa chua", "Bánh socola ganache", "Bánh vani caramel", "Mousse cà phê"}, {"Bánh kem dâu phô mai", "Bánh socola việt quất", "Bánh vani chanh vàng", "Mousse xoài"}};
    private final CustomerOrderRepository customerOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderReviewRepository orderReviewRepository;
    private final DeliveryAddressSnapshotRepository deliveryAddressSnapshotRepository;

    public DataInit(CustomerOrderRepository customerOrderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            OrderReviewRepository orderReviewRepository,
            DeliveryAddressSnapshotRepository deliveryAddressSnapshotRepository) {
        this.customerOrderRepository = customerOrderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.orderReviewRepository = orderReviewRepository;
        this.deliveryAddressSnapshotRepository = deliveryAddressSnapshotRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String[] statuses = {"PENDING", "CONFIRMED", "BAKING", "READY", "DELIVERING", "COMPLETED", "CANCELLED", "CONFIRMED", "COMPLETED"};
        Instant now = Instant.now();
        for (int number = 1; number <= statuses.length; number++) seedOrder(number, statuses[number - 1], now);
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 9 seed orders and 2 reviews");
    }

    private void seedOrder(int number, String status, Instant now) {
        boolean fromOffer = number >= 8;
        int bakery = number == 8 ? 1 : number == 9 ? 3 : 1 + (number - 1) % 3;
        int request = number == 8 ? 5 : 7;
        int customer = fromOffer ? 11 + (request - 1) % 6 : 11 + (number - 1) % 6;
        int product = (bakery - 1) * 4 + 1;
        BigDecimal price = BigDecimal.valueOf(number == 8 ? 470000 : number == 9 ? 490000 : 280000);
        BigDecimal fee = BigDecimal.valueOf(fromOffer || (customer - 11) % 4 == 0 ? 20000 : 30000);
        boolean completed = status.equals("COMPLETED");
        String[] bakeryNames = {"Demo Bánh Dâu", "Demo Socola", "Demo Mây Trắng"};
        customerOrderRepository.findById(id(50, number)).ifPresent(existing -> {
            if (java.util.Objects.equals(existing.getOrderNumber(), "ORD-DEMO-%03d".formatted(number))) existing.setOrderNumber("ORD-260%03d".formatted(number));
            if (java.util.Objects.equals(existing.getCustomerNameSnapshot(), "Khách Demo " + (customer - 10))) existing.setCustomerNameSnapshot(CUSTOMER_NAMES[customer - 11]);
            if (java.util.Objects.equals(existing.getBakeryNameSnapshot(), bakeryNames[bakery - 1])) existing.setBakeryNameSnapshot(SHOP_NAMES[bakery - 1]);
        });
        if (!customerOrderRepository.existsById(id(50, number))) {
            CustomerOrder demoCustomerOrder = new CustomerOrder();
            demoCustomerOrder.setId(id(50, number));
            demoCustomerOrder.setOrderNumber("ORD-260%03d".formatted(number));
            demoCustomerOrder.setCustomerId(id(1, customer));
            demoCustomerOrder.setBakeryId(id(10, bakery));
            demoCustomerOrder.setCakeRequestId(fromOffer ? id(40, request) : null);
            demoCustomerOrder.setOfferId(fromOffer ? id(42, number == 8 ? 7 : 9) : null);
            demoCustomerOrder.setOrderSource(OrderSource.valueOf(fromOffer ? "ACCEPTED_OFFER" : "DIRECT_CATALOG"));
            demoCustomerOrder.setCustomerNameSnapshot(CUSTOMER_NAMES[customer - 11]);
            demoCustomerOrder.setCustomerPhoneSnapshot(phone(customer));
            demoCustomerOrder.setBakeryNameSnapshot(SHOP_NAMES[bakery - 1]);
            demoCustomerOrder.setSubtotal(price);
            demoCustomerOrder.setDeliveryFee(fee);
            demoCustomerOrder.setTotalAmount(price.add(fee));
            demoCustomerOrder.setStatus(OrderStatus.valueOf(status));
            demoCustomerOrder.setNeededAt(completed ? now.minus(3, ChronoUnit.HOURS) : now.plus(5, ChronoUnit.DAYS));
            demoCustomerOrder.setAcceptedAt(status.equals("PENDING") || status.equals("CANCELLED") ? null : now.minus(1, ChronoUnit.DAYS));
            demoCustomerOrder.setCompletedAt(completed ? now.minus(2, ChronoUnit.HOURS) : null);
            demoCustomerOrder.setCreatedAt(now.minus(2, ChronoUnit.DAYS));
            demoCustomerOrder.setUpdatedAt(now.minus(1, ChronoUnit.HOURS));
            demoCustomerOrder.setCurrency("VND");
            customerOrderRepository.save(demoCustomerOrder);
        }
        Map<String, Object> configuration = fromOffer ? Map.of("fixture", true)
                : Map.of("fixture", true, "selectedOptions", List.of(Map.of(
                        "optionGroupId", id(18, product).toString(),
                        "optionValueId", id(19, (product - 1) * 3 + 1).toString(),
                        "groupName", "Kích thước", "valueName", "16 cm")));
        orderItemRepository.findById(id(51, number)).ifPresent(existing -> {
            if (java.util.Objects.equals(existing.getNameSnapshot(), fromOffer ? "Bánh theo báo giá Demo" : "Bánh kem dâu " + bakery)) existing.setNameSnapshot(fromOffer ? (number == 8 ? "Bánh sinh nhật hoa tím" : "Bánh chúc mừng khai trương") : CAKE_NAMES[bakery - 1][0]);
            if (java.util.Objects.equals(existing.getDescriptionSnapshot(), "Dữ liệu mẫu; không giao bánh thật.")) existing.setDescriptionSnapshot("Bánh kem ít ngọt, kích thước 16 cm, kèm hộp và dao cắt bánh.");
        });
        if (!orderItemRepository.existsById(id(51, number))) {
            OrderItem demoOrderItem = new OrderItem();
            demoOrderItem.setId(id(51, number));
            demoOrderItem.setCustomerOrder(customerOrderRepository.getReferenceById(id(50, number)));
            demoOrderItem.setSourceProductId(fromOffer ? null : id(16, product));
            demoOrderItem.setItemType(OrderItemType.valueOf("CAKE"));
            demoOrderItem.setNameSnapshot(fromOffer ? (number == 8 ? "Bánh sinh nhật hoa tím" : "Bánh chúc mừng khai trương") : CAKE_NAMES[bakery - 1][0]);
            demoOrderItem.setDescriptionSnapshot("Bánh kem ít ngọt, kích thước 16 cm, kèm hộp và dao cắt bánh.");
            demoOrderItem.setConfigurationSnapshot(configuration);
            demoOrderItem.setQuantity(1);
            demoOrderItem.setUnitPrice(price);
            demoOrderItem.setLineTotal(price);
            orderItemRepository.save(demoOrderItem);
        }
        seedAddress(number, customer);
        orderStatusHistoryRepository.findById(id(52, number)).ifPresent(existing -> {
            if (java.util.Objects.equals(existing.getNote(), "Trạng thái dữ liệu mẫu")) existing.setNote("Cập nhật tiến độ xử lý đơn hàng.");
        });
        if (!orderStatusHistoryRepository.existsById(id(52, number))) {
            OrderStatusHistory demoOrderStatusHistory = new OrderStatusHistory();
            demoOrderStatusHistory.setId(id(52, number));
            demoOrderStatusHistory.setCustomerOrder(customerOrderRepository.getReferenceById(id(50, number)));
            demoOrderStatusHistory.setToStatus(OrderStatus.valueOf(status));
            demoOrderStatusHistory.setChangedBy(id(1, customer));
            demoOrderStatusHistory.setNote("Cập nhật tiến độ xử lý đơn hàng.");
            demoOrderStatusHistory.setChangedAt(now.minus(1, ChronoUnit.HOURS));
            orderStatusHistoryRepository.save(demoOrderStatusHistory);
        }
        if (completed) {
            orderReviewRepository.findById(id(50, number)).ifPresent(existing -> {
                if (java.util.Objects.equals(existing.getComment(), "Đánh giá mẫu để kiểm thử hiển thị.")) existing.setComment(number == 6 ? "Bánh ngon, kem ít ngọt và giao đúng giờ. Mình sẽ đặt lại." : "Bánh trang trí đẹp, đóng gói cẩn thận. Tiệm phản hồi nhanh.");
            });
            if (!orderReviewRepository.existsById(id(50, number))) {
                OrderReview demoOrderReview = new OrderReview();
                demoOrderReview.setCustomerOrder(customerOrderRepository.getReferenceById(id(50, number)));
                demoOrderReview.setCustomerId(id(1, customer));
                demoOrderReview.setRating((short) (number == 6 ? 5 : 4));
                demoOrderReview.setComment(number == 6 ? "Bánh ngon, kem ít ngọt và giao đúng giờ. Mình sẽ đặt lại." : "Bánh trang trí đẹp, đóng gói cẩn thận. Tiệm phản hồi nhanh.");
                demoOrderReview.setStatus(ReviewStatus.valueOf("PUBLISHED"));
                demoOrderReview.setCreatedAt(Instant.now());
                demoOrderReview.setUpdatedAt(Instant.now());
                orderReviewRepository.save(demoOrderReview);
            }
        }
    }

    private void seedAddress(int number, int customer) {
        String[] districts = {"Quận 5", "Quận 1", "Bình Thạnh", "Quận 3"};
        deliveryAddressSnapshotRepository.findById(id(50, number)).ifPresent(existing -> {
            if (java.util.Objects.equals(existing.getRecipientName(), "Khách Demo " + (customer - 10))) existing.setRecipientName(CUSTOMER_NAMES[customer - 11]);
            if (java.util.Objects.equals(existing.getDeliveryNote(), "Địa chỉ mẫu DataInit")) existing.setDeliveryNote("Gọi trước khi giao khoảng 15 phút, vui lòng giữ bánh thẳng đứng.");
        });
        if (!deliveryAddressSnapshotRepository.existsById(id(50, number))) {
            DeliveryAddressSnapshot demoDeliveryAddressSnapshot = new DeliveryAddressSnapshot();
            demoDeliveryAddressSnapshot.setCustomerOrder(customerOrderRepository.getReferenceById(id(50, number)));
            demoDeliveryAddressSnapshot.setRecipientName(CUSTOMER_NAMES[customer - 11]);
            demoDeliveryAddressSnapshot.setRecipientPhone(phone(customer));
            demoDeliveryAddressSnapshot.setAddressLine((customer + 9) + " Nguyễn Văn Cừ");
            demoDeliveryAddressSnapshot.setWard("Phường 4");
            demoDeliveryAddressSnapshot.setDistrict(districts[(customer - 11) % 4]);
            demoDeliveryAddressSnapshot.setCity("TP. Hồ Chí Minh");
            demoDeliveryAddressSnapshot.setDeliveryNote("Gọi trước khi giao khoảng 15 phút, vui lòng giữ bánh thẳng đứng.");
            deliveryAddressSnapshotRepository.save(demoDeliveryAddressSnapshot);
        }
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }

    private static String phone(int number) { return "090%07d".formatted(number); }
}
