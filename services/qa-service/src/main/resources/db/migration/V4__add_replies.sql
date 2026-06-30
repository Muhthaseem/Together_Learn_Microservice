CREATE TABLE answer_replies (
    id         BIGSERIAL PRIMARY KEY,
    reply_id   VARCHAR(36) NOT NULL UNIQUE,
    answer_id  VARCHAR(36) NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    author_id  VARCHAR(36) NOT NULL,
    content    TEXT        NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
