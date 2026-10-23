package com.se193262.orderservice.infrastructure.client;

public class RemoteServiceException extends RuntimeException {

    private final String serviceName;
    private final Integer remoteStatus;

    public RemoteServiceException(String serviceName, Integer remoteStatus, Throwable cause) {
        super("Request to " + serviceName + " failed", cause);
        this.serviceName = serviceName;
        this.remoteStatus = remoteStatus;
    }

    public String getServiceName() {
        return serviceName;
    }

    public Integer getRemoteStatus() {
        return remoteStatus;
    }
}