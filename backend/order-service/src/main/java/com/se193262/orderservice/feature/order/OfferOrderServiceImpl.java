package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.*;
import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.exception.BusinessException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class OfferOrderServiceImpl implements OfferOrderService {
    private final OfferOrderRepository repository;
    private final ServiceHttpClient http;
    private final OrderInventoryService inventory;

    public OfferOrderServiceImpl(OfferOrderRepository repository, ServiceHttpClient http, OrderInventoryService inventory) {
        this.inventory = inventory;
        this.repository = repository;
        this.http = http;
    }

    public Creation create(String key, CreateOfferOrderRequest command) {
        if (!("accept-offer:" + command.offerId()).equals(key)) throw BusinessException.conflict();
        String fingerprint = fingerprint(command);
        var existing = repository.existing(key, fingerprint, command.offerId());
        if (existing.isPresent()) return new Creation(existing.get(), false);
        var p = http.properties();
        var source =
                http.get(
                        p.marketplaceUrl(),
                        "/internal/v1/offers/" + command.offerId() + "/order-source",
                        "marketplace-service",
                        "marketplace:offer:read",
                        OfferOrderSource.class);
        if (!source.offerId().equals(command.offerId())
                || !source.cakeRequestId().equals(command.cakeRequestId())
                || !source.customerId().equals(command.customerId()))
            throw BusinessException.invalid("Offer snapshot mismatch");
        @SuppressWarnings("unchecked")
        Map<String, Object> user =
                http.get(
                        p.identityUrl(),
                        "/internal/v1/users/" + command.customerId(),
                        "identity-service",
                        "identity:user:read",
                        Map.class);
        Map<String, Object> address = address(command);
        @SuppressWarnings("unchecked")
        Map<String, Object> bakery =
                http.get(
                        p.bakeryUrl(),
                        "/internal/v1/bakeries/" + source.bakeryId(),
                        "bakery-service",
                        "bakery:profile:read",
                        Map.class);
        if (user.get("phoneNumber") == null
                || !matchLocation(source.deliveryCity(), (String) address.get("city"))
                || !matchLocation(source.deliveryDistrict(), (String) address.get("district")))
            throw BusinessException.invalid("Customer phone/address invalid");
        var selections = source.items().stream().filter(item -> item.addOnId() != null)
                .map(item -> new com.se193262.orderservice.infrastructure.client.AddOnInventoryClient.Selection(item.addOnId(), item.quantity())).toList();
        return inventory.create(source.bakeryId(), selections, candidateId -> {
            try {
                return repository.save(candidateId, key, fingerprint, command, source, user, bakery, address);
            } catch (DataIntegrityViolationException concurrent) {
                return new Creation(
                        repository
                                .existing(key, fingerprint, command.offerId())
                                .orElseThrow(BusinessException::conflict),
                        false);
            }
        });
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> address(CreateOfferOrderRequest command) {
        try {
            return http.get(
                    http.properties().identityUrl(),
                    "/internal/v1/users/"
                            + command.customerId()
                            + "/addresses/"
                            + command.deliveryAddressId(),
                    "identity-service",
                    "identity:address:read",
                    Map.class);
        } catch (BusinessException error) {
            if (error.status() == 404) throw BusinessException.invalid("Invalid delivery address");
            throw error;
        }
    }

    static String fingerprint(CreateOfferOrderRequest command) {
        try {
            String note = command.deliveryNote();
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(
                                            (command.offerId()
                                                            + "|"
                                                            + command.cakeRequestId()
                                                            + "|"
                                                            + command.customerId()
                                                            + "|"
                                                            + command.deliveryAddressId()
                                                            + "|"
                                                            + (note == null
                                                                    ? "-1:"
                                                                    : note.length() + ":" + note))
                                                    .getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    static boolean matchLocation(String expected, String actual) {
        if (expected == null || actual == null) return false;
        if (expected.trim().equalsIgnoreCase(actual.trim())) return true;
        String e = normalizeLocation(expected);
        String a = normalizeLocation(actual);
        if (e.equals(a)) return true;
        if ((e.length() >= 3 && a.contains(e)) || (a.length() >= 3 && e.contains(a))) return true;
        return false;
    }

    static String normalizeLocation(String text) {
        if (text == null) return "";
        String s = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace("đ", "d")
                .replaceAll("[^a-z0-9]", " ")
                .trim();
        s = s.replaceAll("^(?:thanh pho|tp|tinh|quan|huyen|thi xa|tx|district|d)\\s+", "");
        s = s.replaceAll("^q(?=\\d)", "");
        s = s.replaceAll("\\s+", " ").trim();
        if (s.equals("hcm") || s.equals("ho chi minh") || s.equals("sai gon")) {
            return "hcm";
        }
        return s;
    }
}
