package com.se193262.bakeryservice.feature.bakery;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BakeryStatusTest {
    @Test
    @DisplayName("Bakery must be submitted before approval and a closed bakery cannot reopen")
    void changeStatus_requiresValidWorkflow() {
        Bakery bakery = new Bakery("Bakery", "0900000000", null);
        assertThatThrownBy(() -> bakery.changeStatus(BakeryStatus.ACTIVE))
                .isInstanceOf(IllegalStateException.class);
        bakery.submitForApproval();
        bakery.changeStatus(BakeryStatus.ACTIVE);
        bakery.changeStatus(BakeryStatus.SUSPENDED);
        bakery.changeStatus(BakeryStatus.ACTIVE);
        bakery.changeStatus(BakeryStatus.CLOSED);
        assertThat(bakery.getStatus()).isEqualTo(BakeryStatus.CLOSED);
        assertThatThrownBy(() -> bakery.changeStatus(BakeryStatus.ACTIVE))
                .isInstanceOf(IllegalStateException.class);
    }
}
