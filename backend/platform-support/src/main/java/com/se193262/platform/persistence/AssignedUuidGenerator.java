package com.se193262.platform.persistence;

import java.util.EnumSet;
import java.util.UUID;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;

/** Normal creation generates a UUID; DataInit may supply a stable fixture UUID. */
public class AssignedUuidGenerator implements BeforeExecutionGenerator {
    @Override
    public Object generate(SharedSessionContractImplementor session, Object owner, Object currentValue, EventType eventType) {
        UUID requestedId = ((UuidEntity) owner).requestedId();
        return requestedId == null ? UUID.randomUUID() : requestedId;
    }

    @Override
    public EnumSet<EventType> getEventTypes() { return EnumSet.of(EventType.INSERT); }
}
