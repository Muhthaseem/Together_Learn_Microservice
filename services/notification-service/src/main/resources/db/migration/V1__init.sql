CREATE TABLE notifications (
    id              BIGSERIAL    PRIMARY KEY,
    notification_id VARCHAR(36)  NOT NULL UNIQUE,
    recipient_id    VARCHAR(36)  NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT         NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    VARCHAR(36),
    is_read         BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
