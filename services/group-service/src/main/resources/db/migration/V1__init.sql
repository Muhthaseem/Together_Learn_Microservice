CREATE TABLE study_groups (
    id               BIGSERIAL    PRIMARY KEY,
    group_id         VARCHAR(36)  NOT NULL UNIQUE,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    creator_id       VARCHAR(36)  NOT NULL,
    course_code      VARCHAR(50)  NOT NULL,
    scheduled_date   DATE,
    scheduled_time   TIME,
    location         VARCHAR(255),
    mode             VARCHAR(20)  NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    max_participants INTEGER      NOT NULL DEFAULT 20,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE group_participants (
    id        BIGSERIAL   PRIMARY KEY,
    group_id  VARCHAR(36) NOT NULL,
    user_id   VARCHAR(36) NOT NULL,
    role      VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);
