package com.se193262.bakeryservice.feature.bakery.entity;

import com.se193262.platform.persistence.UuidEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "business_hours")
public class BusinessHour extends UuidEntity {


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @Column(name = "day_of_week", nullable = false)
    private short dayOfWeek;

    @Column(name = "opens_at")
    private LocalTime opensAt;

    @Column(name = "closes_at")
    private LocalTime closesAt;

    @Column(name = "closed", nullable = false)
    private boolean isClosed;

    public BusinessHour() {
    }

    public BusinessHour(Bakery bakery, short dayOfWeek, LocalTime opensAt, LocalTime closesAt, boolean isClosed) {
        this.bakery = bakery;
        this.dayOfWeek = dayOfWeek;
        this.opensAt = opensAt;
        this.closesAt = closesAt;
        this.isClosed = isClosed;
    }

    public void update(LocalTime opensAt, LocalTime closesAt, boolean isClosed) {
        this.opensAt = opensAt;
        this.closesAt = closesAt;
        this.isClosed = isClosed;
    }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public short getDayOfWeek() { return dayOfWeek; }
    public LocalTime getOpensAt() { return opensAt; }
    public LocalTime getClosesAt() { return closesAt; }
    public boolean isClosed() { return isClosed; }

    public void setBakery(Bakery value) { this.bakery = value; }
    public void setDayOfWeek(short value) { this.dayOfWeek = value; }
    public void setOpensAt(LocalTime value) { this.opensAt = value; }
    public void setClosesAt(LocalTime value) { this.closesAt = value; }
    public void setClosed(boolean value) { this.isClosed = value; }
}
