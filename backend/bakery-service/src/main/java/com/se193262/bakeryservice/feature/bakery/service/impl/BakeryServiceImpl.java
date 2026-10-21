package com.se193262.bakeryservice.feature.bakery.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryAddress;
import com.se193262.bakeryservice.feature.bakery.entity.BusinessHour;
import com.se193262.bakeryservice.feature.bakery.entity.ServiceArea;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryAddressRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BusinessHourRepository;
import com.se193262.bakeryservice.feature.bakery.repository.ServiceAreaRepository;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class BakeryServiceImpl implements BakeryService {

    private final BakeryRepository bakeryRepository;
    private final BakeryMemberRepository bakeryMemberRepository;
    private final BakeryAddressRepository addressRepository;
    private final ServiceAreaRepository serviceAreaRepository;
    private final BusinessHourRepository businessHourRepository;

    public BakeryServiceImpl(BakeryRepository bakeryRepository,
                             BakeryMemberRepository bakeryMemberRepository,
                             BakeryAddressRepository addressRepository,
                             ServiceAreaRepository serviceAreaRepository,
                             BusinessHourRepository businessHourRepository) {
        this.bakeryRepository = bakeryRepository;
        this.bakeryMemberRepository = bakeryMemberRepository;
        this.addressRepository = addressRepository;
        this.serviceAreaRepository = serviceAreaRepository;
        this.businessHourRepository = businessHourRepository;
    }

    @Override
    @Transactional
    public BakeryDto create(BakeryDto request, UUID ownerUserId) {
        rejectServerFields(request);
        if (ownerUserId == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "X-User-Id is required until JWT is configured");
        }
        String name = required(request.name(), "name");
        String phoneNumber = required(request.phoneNumber(), "phoneNumber");
        Bakery bakery = new Bakery(name, phoneNumber, normalized(request.email()));
        bakery.updateProfile(null, request.description(), null, null);
        bakeryRepository.saveAndFlush(bakery);
        bakeryMemberRepository.save(new BakeryMember(bakery, ownerUserId, BakeryMemberRole.OWNER));
        return toDto(bakery);
    }

    @Override
    @Transactional(readOnly = true)
    public BakeryDto get(UUID bakeryId) {
        return toDto(findBakery(bakeryId));
    }

    @Override
    @Transactional
    public BakeryDto update(UUID bakeryId, BakeryDto request) {
        rejectServerFields(request);
        Bakery bakery = findBakery(bakeryId);
        bakery.updateProfile(
                request.name() == null ? null : required(request.name(), "name"),
                request.description(),
                request.phoneNumber() == null ? null : required(request.phoneNumber(), "phoneNumber"),
                normalized(request.email())
        );
        bakeryRepository.flush();
        return toDto(bakery);
    }

    @Override
    @Transactional
    public BakeryOperationsDto replaceOperations(UUID bakeryId, BakeryOperationsDto request) {
        Bakery bakery = findBakery(bakeryId);
        validateOperations(request);
        replaceAddresses(bakery, request.addresses());
        replaceServiceAreas(bakery, request.serviceAreas());
        replaceBusinessHours(bakery, request.businessHours());
        addressRepository.flush();
        serviceAreaRepository.flush();
        businessHourRepository.flush();
        return toOperations(bakeryId);
    }

    private Bakery findBakery(UUID bakeryId) {
        return bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
    }

    private void rejectServerFields(BakeryDto request) {
        if (request == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.id() != null || request.status() != null || request.operations() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "id, status and operations cannot be changed here");
        }
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static String normalized(String value) {
        return value == null ? null : value.trim();
    }

    private void validateOperations(BakeryOperationsDto request) {
        if (request == null || request.addresses() == null
                || request.serviceAreas() == null || request.businessHours() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "All operation lists are required");
        }
        long primaryCount = request.addresses().stream()
                .filter(address -> Boolean.TRUE.equals(address.isPrimary())).count();
        if (primaryCount > 1) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Only one primary address is allowed");
        }
        Set<String> areaKeys = new HashSet<>();
        for (BakeryOperationsDto.ServiceArea area : request.serviceAreas()) {
            String key = required(area.city(), "city").toLowerCase(Locale.ROOT) + "\u0000"
                    + required(area.district(), "district").toLowerCase(Locale.ROOT);
            if (!areaKeys.add(key)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Duplicate service area");
            }
        }
        Set<Short> days = new HashSet<>();
        for (BakeryOperationsDto.BusinessHour hour : request.businessHours()) {
            if (hour.dayOfWeek() == null || hour.dayOfWeek() < 1 || hour.dayOfWeek() > 7
                    || !days.add(hour.dayOfWeek())) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Business days must be unique and between 1 and 7");
            }
            if (!Boolean.TRUE.equals(hour.closed()) && (hour.opensAt() == null
                    || hour.closesAt() == null || !hour.opensAt().isBefore(hour.closesAt()))) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Opening time must be before closing time");
            }
        }
    }

    private void replaceAddresses(Bakery bakery, List<BakeryOperationsDto.Address> requested) {
        Map<UUID, BakeryAddress> existing = new HashMap<>();
        for (BakeryAddress address : addressRepository.findAllByBakery_Id(bakery.getId())) {
            existing.put(address.getId(), address);
        }
        verifyIds(requested.stream().map(BakeryOperationsDto.Address::id).toList(), existing.keySet());
        Set<UUID> retained = new HashSet<>();
        requested.stream().map(BakeryOperationsDto.Address::id)
                .filter(id -> id != null).forEach(retained::add);
        List<BakeryAddress> removed = existing.values().stream()
                .filter(address -> !retained.contains(address.getId())).toList();
        addressRepository.deleteAll(removed);
        addressRepository.flush();

        // Clear the old primary first so the partial unique index permits a new primary.
        existing.values().stream().filter(address -> retained.contains(address.getId()))
                .forEach(BakeryAddress::clearPrimary);
        addressRepository.flush();

        List<BakeryAddress> saved = new ArrayList<>();
        for (BakeryOperationsDto.Address item : requested) {
            BakeryAddress address = item.id() == null
                    ? new BakeryAddress(bakery, item.addressLine().trim(), item.district().trim(), item.city().trim())
                    : existing.get(item.id());
            address.update(item.addressLine().trim(), normalized(item.ward()), item.district().trim(),
                    item.city().trim(), item.latitude(), item.longitude(), Boolean.TRUE.equals(item.isPrimary()));
            saved.add(address);
        }
        addressRepository.saveAll(saved);
    }

    private void replaceServiceAreas(Bakery bakery, List<BakeryOperationsDto.ServiceArea> requested) {
        Map<UUID, ServiceArea> existing = new HashMap<>();
        for (ServiceArea area : serviceAreaRepository.findAllByBakery_Id(bakery.getId())) {
            existing.put(area.getId(), area);
        }
        verifyIds(requested.stream().map(BakeryOperationsDto.ServiceArea::id).toList(), existing.keySet());
        Set<UUID> retained = new HashSet<>();
        requested.stream().map(BakeryOperationsDto.ServiceArea::id)
                .filter(id -> id != null).forEach(retained::add);
        serviceAreaRepository.deleteAll(existing.values().stream()
                .filter(area -> !retained.contains(area.getId())).toList());
        serviceAreaRepository.flush();
        List<ServiceArea> saved = new ArrayList<>();
        for (BakeryOperationsDto.ServiceArea item : requested) {
            ServiceArea area = item.id() == null
                    ? new ServiceArea(bakery, item.city().trim(), item.district().trim())
                    : existing.get(item.id());
            area.update(item.city().trim(), item.district().trim(), item.deliveryFee(),
                    item.minimumOrder(), Boolean.TRUE.equals(item.active()));
            saved.add(area);
        }
        serviceAreaRepository.saveAll(saved);
    }

    private void replaceBusinessHours(Bakery bakery, List<BakeryOperationsDto.BusinessHour> requested) {
        Map<Short, BusinessHour> existing = new HashMap<>();
        for (BusinessHour hour : businessHourRepository.findAllByBakery_Id(bakery.getId())) {
            existing.put(hour.getDayOfWeek(), hour);
        }
        Set<Short> retained = new HashSet<>();
        requested.forEach(hour -> retained.add(hour.dayOfWeek()));
        businessHourRepository.deleteAll(existing.values().stream()
                .filter(hour -> !retained.contains(hour.getDayOfWeek())).toList());
        businessHourRepository.flush();
        List<BusinessHour> saved = new ArrayList<>();
        for (BakeryOperationsDto.BusinessHour item : requested) {
            BusinessHour hour = existing.get(item.dayOfWeek());
            if (hour == null) {
                hour = new BusinessHour(bakery, item.dayOfWeek(), item.opensAt(), item.closesAt(),
                        Boolean.TRUE.equals(item.closed()));
            } else {
                hour.update(item.opensAt(), item.closesAt(), Boolean.TRUE.equals(item.closed()));
            }
            saved.add(hour);
        }
        businessHourRepository.saveAll(saved);
    }

    private static void verifyIds(List<UUID> requestedIds, Set<UUID> ownedIds) {
        Set<UUID> seen = new HashSet<>();
        for (UUID id : requestedIds) {
            if (id == null) continue;
            if (!seen.add(id) || !ownedIds.contains(id)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Operation ID does not belong to this bakery or is duplicated");
            }
        }
    }

    private BakeryDto toDto(Bakery bakery) {
        return new BakeryDto(bakery.getId(), bakery.getName(), bakery.getDescription(),
                bakery.getPhoneNumber(), bakery.getEmail(), bakery.getStatus(),
                toOperations(bakery.getId()));
    }

    private BakeryOperationsDto toOperations(UUID bakeryId) {
        List<BakeryOperationsDto.Address> addresses = addressRepository.findAllByBakery_Id(bakeryId)
                .stream().sorted(Comparator.comparing(BakeryAddress::getId))
                .map(address -> new BakeryOperationsDto.Address(address.getId(), address.getAddressLine(),
                        address.getWard(), address.getDistrict(), address.getCity(), address.getLatitude(),
                        address.getLongitude(), address.isPrimary())).toList();
        List<BakeryOperationsDto.ServiceArea> areas = serviceAreaRepository.findAllByBakery_Id(bakeryId)
                .stream().sorted(Comparator.comparing(ServiceArea::getId))
                .map(area -> new BakeryOperationsDto.ServiceArea(area.getId(), area.getCity(), area.getDistrict(),
                        area.getDeliveryFee(), area.getMinimumOrder(), area.isActive())).toList();
        List<BakeryOperationsDto.BusinessHour> hours = businessHourRepository.findAllByBakery_Id(bakeryId)
                .stream().sorted(Comparator.comparingInt(BusinessHour::getDayOfWeek))
                .map(hour -> new BakeryOperationsDto.BusinessHour(hour.getDayOfWeek(), hour.getOpensAt(),
                        hour.getClosesAt(), hour.isClosed())).toList();
        return new BakeryOperationsDto(addresses, areas, hours);
    }
}
