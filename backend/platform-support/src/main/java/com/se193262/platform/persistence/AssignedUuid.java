package com.se193262.platform.persistence;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import org.hibernate.annotations.IdGeneratorType;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@IdGeneratorType(AssignedUuidGenerator.class)
@Retention(RUNTIME)
@Target(FIELD)
public @interface AssignedUuid { }
