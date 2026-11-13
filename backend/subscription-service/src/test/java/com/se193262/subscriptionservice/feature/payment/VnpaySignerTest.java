package com.se193262.subscriptionservice.feature.payment;

import com.se193262.subscriptionservice.config.VnpayProperties;
import com.se193262.subscriptionservice.infrastructure.payment.VnpaySigner;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class VnpaySignerTest {
    @Test @DisplayName("Canonical VNPay query and HMAC match an independently computed SHA512 vector")
    void sign_unsortedFields_matchesKnownVector() {
        var signer = new VnpaySigner(new VnpayProperties(true, "TESTCODE", "test-secret-only", "", "", 15));
        var fields = Map.of("vnp_TmnCode", "TESTCODE", "vnp_OrderInfo", "Subscription test",
                "vnp_Amount", "10000000", "vnp_SecureHash", "ignored", "vnp_SecureHashType", "SHA512",
                "vnp_BankCode", "", "unrelated", "ignored");
        assertThat(signer.query(fields)).isEqualTo("vnp_Amount=10000000&vnp_OrderInfo=Subscription+test&vnp_TmnCode=TESTCODE");
        assertThat(signer.sign(fields)).isEqualTo("22608a93ba17da57c8328b6a30a40725ad350d70d3819d193bc7c37a4f7892e5cbae55a067f6d6f28890c800814c26f47110a250432b6471c3c81ddb82082c8f");
    }
}
