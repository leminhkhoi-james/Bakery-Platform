package com.se193262.cakeaiservice.infrastructure.client;

public class ProviderException extends RuntimeException {
    private final String code;
    public ProviderException(String code) { super(code); this.code = code; }
    public String code() { return code; }
}
