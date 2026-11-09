package com.se193262.cakeaiservice.infrastructure.storage;

import com.se193262.platform.exception.BusinessException;

public class StorageFailureException extends BusinessException {
    public StorageFailureException() { super(503, "Durable image storage unavailable"); }
}
