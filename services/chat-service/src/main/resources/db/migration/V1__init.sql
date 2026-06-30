CREATE TABLE chat_messages (
    id         BIGSERIAL   PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL UNIQUE,
    group_id   VARCHAR(36) NOT NULL,
    author_id  VARCHAR(36) NOT NULL,
    content    TEXT        NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_group_time ON chat_messages(group_id, created_at);
