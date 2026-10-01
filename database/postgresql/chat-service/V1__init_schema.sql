CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cake_request_id UUID NOT NULL,
    order_id UUID,
    customer_id UUID NOT NULL,
    bakery_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_conversations_request_bakery UNIQUE (cake_request_id, bakery_id),
    CONSTRAINT ck_conversations_status CHECK (status IN ('OPEN', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    participant_type VARCHAR(30) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ,
    CONSTRAINT uq_conversation_participants_user UNIQUE (conversation_id, user_id),
    CONSTRAINT uq_conversation_participants_id_conversation UNIQUE (id, conversation_id),
    CONSTRAINT fk_conversation_participants_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT ck_conversation_participants_type CHECK (participant_type IN ('CUSTOMER', 'BAKERY_OWNER', 'BAKERY_STAFF'))
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_participant_id UUID NOT NULL,
    client_message_id UUID NOT NULL UNIQUE,
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    content TEXT,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender_conversation
        FOREIGN KEY (sender_participant_id, conversation_id)
        REFERENCES conversation_participants(id, conversation_id) ON DELETE RESTRICT,
    CONSTRAINT ck_messages_type CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM'))
);

CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_message_attachments_message
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT ck_message_attachments_size CHECK (file_size > 0)
);

CREATE TABLE message_receipts (
    message_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (message_id, participant_id),
    CONSTRAINT fk_message_receipts_message
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_receipts_participant
        FOREIGN KEY (participant_id) REFERENCES conversation_participants(id) ON DELETE CASCADE,
    CONSTRAINT ck_message_receipts_times CHECK (read_at IS NULL OR delivered_at IS NULL OR read_at >= delivered_at)
);

CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_bakery_id ON conversations(bakery_id);
CREATE INDEX idx_conversations_order_id ON conversations(order_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender_participant_id ON messages(sender_participant_id);
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_receipts_participant_id ON message_receipts(participant_id);
