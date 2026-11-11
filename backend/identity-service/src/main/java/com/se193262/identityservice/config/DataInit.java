package com.se193262.identityservice.config;

import com.se193262.identityservice.feature.address.UserAddress;
import com.se193262.identityservice.feature.address.UserAddressJpaRepository;
import com.se193262.identityservice.feature.user.CustomerProfile;
import com.se193262.identityservice.feature.user.RoleRepository;
import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserRepository;
import com.se193262.identityservice.feature.user.UserStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private static final String[] CUSTOMER_NAMES = {"Nguyễn Hoàng An", "Trần Minh Khang", "Lê Ngọc Mai", "Phạm Anh Thư", "Võ Gia Huy", "Đặng Khánh Linh"};
    private static final String[] OWNER_NAMES = {"Nguyễn Minh Anh", "Trần Quốc Bảo", "Lê Thu Hà", "Phạm Ngọc Linh", "Võ Hoàng Nam", "Đặng Thảo Vy"};
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserAddressJpaRepository addressRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInit(UserRepository userRepository, RoleRepository roleRepository,
            UserAddressJpaRepository addressRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Account> accounts = accounts();
        checkEmails(accounts);
        String passwordHash = passwordEncoder.encode("123123");
        for (Account account : accounts) seedAccount(account, passwordHash);
        seedAddresses();
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 15 seed accounts; existing accounts retained");
    }

    private void checkEmails(List<Account> accounts) {
        for (Account account : accounts) {
            UUID userId = id(1, account.number());
            var current = userRepository.findById(userId);
            if (current.isPresent() && !current.get().getEmail().equals(account.legacyEmail())) continue;
            var existing = userRepository.findByEmailIgnoreCase(account.email());
            if (existing.isPresent() && !existing.get().getId().equals(userId)) {
                throw new IllegalStateException("Seed email already belongs to another ID: " + account.email()
                        + ". No existing account was changed; disable the seed profile or use a separate demo database.");
            }
        }
    }

    private void seedAccount(Account account, String passwordHash) {
        UUID userId = id(1, account.number());
        var existing = userRepository.findById(userId);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getEmail().equals(account.legacyEmail())) user.setEmail(account.email());
            if (legacyName(account.number()).equals(user.getDisplayName())) user.setDisplayName(account.name());
            return;
        }
        Instant now = Instant.now();
        User user = new User();
        user.setId(userId);
        user.setEmail(account.email());
        user.setPasswordHash(passwordHash);
        user.setDisplayName(account.name());
        user.setPhoneNumber(phone(account.number()));
        user.setStatus(account.number() == 41 ? UserStatus.BLOCKED : UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        for (int role : account.roles()) user.addRole(roleRepository.findById((short) role).orElseThrow());
        if (account.roles().contains(1)) user.setCustomerProfile(new CustomerProfile(user, "vi", now));
        userRepository.save(user);
    }

    private void seedAddresses() {
        String[] districts = {"Quận 5", "Quận 1", "Bình Thạnh", "Quận 3"};
        for (int number = 1; number <= 6; number++) {
            UUID userId = id(1, 10 + number);
            int customerIndex = number - 1;
            addressRepository.findById(id(2, number)).ifPresent(existing -> {
                if ("Nhà riêng Demo".equals(existing.getLabel())) existing.setLabel("Nhà riêng");
                if (("Khách Demo " + (customerIndex + 1)).equals(existing.getRecipientName())) existing.setRecipientName(CUSTOMER_NAMES[customerIndex]);
            });
            if (addressRepository.existsById(id(2, number)) || addressRepository.existsByUserIdAndIsDefaultTrue(userId)) continue;
            UserAddress address = new UserAddress();
            address.setId(id(2, number));
            address.setUserId(userId);
            address.setLabel("Nhà riêng");
            address.setRecipientName(CUSTOMER_NAMES[number - 1]);
            address.setRecipientPhone(phone(10 + number));
            address.setAddressLine((19 + number) + " Nguyễn Văn Cừ");
            address.setWard("Phường 4");
            address.setDistrict(districts[(number - 1) % 4]);
            address.setCity("TP. Hồ Chí Minh");
            address.setDefault(true);
            addressRepository.save(address);
        }
    }

    private String legacyName(int number) {
        if (number == 1) return "Admin Demo";
        if (number == 2) return "Admin Demo 2";
        if (number >= 11 && number <= 16) return "Khách Demo " + (number - 10);
        if (number >= 21 && number <= 23) return "Chủ tiệm Demo " + (number - 20);
        if (number >= 31 && number <= 33) return "Đăng ký đối tác " + (number - 30);
        return "Tài khoản bị khóa Demo";
    }

    private List<Account> accounts() {
        List<Account> result = new ArrayList<>();
        result.add(new Account(1, "admin", "admin", "Quản trị viên", List.of(4)));
        result.add(new Account(2, "admin2", "admin2", "Nguyễn Tuấn Anh", List.of(4)));
        for (int number = 1; number <= 6; number++) {
            result.add(new Account(10 + number, "user" + number, "customer" + number, CUSTOMER_NAMES[number - 1], List.of(1)));
        }
        for (int number = 1; number <= 3; number++) {
            result.add(new Account(20 + number, "shop" + number, "owner" + number, OWNER_NAMES[number - 1], List.of(1, 2)));
            result.add(new Account(30 + number, "newshop" + number, "partner" + number, OWNER_NAMES[number + 2], List.of(1)));
        }
        result.add(new Account(41, "block", "blocked", "Bùi Thanh Sơn", List.of(1)));
        return result;
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }

    private static String phone(int number) { return "090%07d".formatted(number); }
    private record Account(int number, String login, String legacyLogin, String name, List<Integer> roles) {
        String email() { return login + "@gmail.com"; }
        String legacyEmail() { return legacyLogin + "@demo.test"; }
    }
}
