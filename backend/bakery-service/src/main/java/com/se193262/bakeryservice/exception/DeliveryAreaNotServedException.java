package com.se193262.bakeryservice.exception;

import org.springframework.http.HttpStatus;

public class DeliveryAreaNotServedException extends AppException {
    public static final String ERROR_CODE = "DELIVERY_AREA_NOT_SERVED";

    public DeliveryAreaNotServedException() {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "Tiệm chưa hỗ trợ giao đến khu vực này.");
    }
}
