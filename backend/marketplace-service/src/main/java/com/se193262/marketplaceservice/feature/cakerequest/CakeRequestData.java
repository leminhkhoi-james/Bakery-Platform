package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.CreateCakeRequestRequest;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.Quote;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CakeRequestData {
    private final CakePreferenceRepository preferences;
    private final RequestOptionSelectionRepository options;
    private final RequestStatusHistoryRepository histories;

    public CakeRequestData(
            CakePreferenceRepository preferences,
            RequestOptionSelectionRepository options,
            RequestStatusHistoryRepository histories) {
        this.preferences = preferences;
        this.options = options;
        this.histories = histories;
    }

    public void configuration(UUID id, CreateCakeRequestRequest command, Quote quote) {
        if (command.preference() == null) preferences.deleteById(id);
        else {
            var c = command.preference();
            var p = preferences.findById(id).orElseGet(CakePreference::create);
            p.setCakeRequestId(id);
            p.setCakeSize(c.cakeSize());
            p.setCakeShape(c.cakeShape());
            p.setFlavor(c.flavor());
            p.setFilling(c.filling());
            p.setFrosting(c.frosting());
            p.setColorPalette(c.colorPalette());
            p.setDecorationNotes(c.decorationNotes());
            p.setAllergyNotes(c.allergyNotes());
            p.setExtraOptions(c.extraOptions() == null ? Map.of() : c.extraOptions());
            preferences.save(p);
        }
        options.deleteByCakeRequestId(id);
        options.flush();
        if (quote != null)
            for (var snapshot : quote.options()) {
                var o = RequestOptionSelection.create();
                o.setId(UUID.randomUUID());
                o.setCakeRequestId(id);
                o.setOptionGroupId(snapshot.optionGroupId());
                o.setOptionValueId(snapshot.optionValueId());
                o.setGroupNameSnapshot(snapshot.groupNameSnapshot());
                o.setValueNameSnapshot(snapshot.valueNameSnapshot());
                o.setQuantity(snapshot.quantity());
                options.save(o);
            }
    }

    public void history(
            CakeRequest request,
            RequestStatus previous,
            UUID actor,
            String reason,
            java.time.Instant now) {
        var history = RequestStatusHistory.create();
        history.setId(UUID.randomUUID());
        history.setCakeRequestId(request.getId());
        history.setFromStatus(previous == null ? null : previous.name());
        history.setToStatus(request.getStatus().name());
        history.setChangedBy(actor);
        history.setReason(reason);
        history.setChangedAt(now);
        histories.save(history);
    }
}
