package com.se193262.chatservice.feature.conversation;

public enum ParticipantType {
    CUSTOMER,
    BAKERY_OWNER,
    /** Historical message attribution only; cannot authorize access or create participants. */
    BAKERY_STAFF
}
