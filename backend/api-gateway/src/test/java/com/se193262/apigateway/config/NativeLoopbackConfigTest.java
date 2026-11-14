package com.se193262.apigateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class NativeLoopbackConfigTest {
    @Test
    void addsOnlyIpv6LoopbackAtTheSamePort() {
        var factory = new TomcatServletWebServerFactory();
        new NativeLoopbackConfig().nativeLoopbackListeners("127.0.0.1", 8080).customize(factory);
        assertThat(factory.getAdditionalConnectors()).singleElement().satisfies(connector -> {
            assertThat(connector.getPort()).isEqualTo(8080);
            assertThat(connector.getProperty("address").toString()).contains("0:0:0:0:0:0:0:1");
        });
    }

    @Test
    void rejectsWildcardOrAmbiguousPrimaryBinding() {
        for (String address : new String[]{"", "0.0.0.0", "::", "localhost", "::1"}) {
            assertThatIllegalArgumentException().isThrownBy(() ->
                    new NativeLoopbackConfig().nativeLoopbackListeners(address, 8080));
        }
        assertThatIllegalArgumentException().isThrownBy(() ->
                new NativeLoopbackConfig().nativeLoopbackListeners("127.0.0.1", 0));
    }
}
