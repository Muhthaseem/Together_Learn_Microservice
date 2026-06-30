CREATE TABLE questions (
    id           BIGSERIAL    PRIMARY KEY,
    question_id  VARCHAR(36)  NOT NULL UNIQUE,
    title        VARCHAR(255) NOT NULL,
    body         TEXT         NOT NULL,
    author_id    VARCHAR(36)  NOT NULL,
    course_code  VARCHAR(50),
    tags         VARCHAR(500),
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    answer_count INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE answers (
    id          BIGSERIAL   PRIMARY KEY,
    answer_id   VARCHAR(36) NOT NULL UNIQUE,
    question_id VARCHAR(36) NOT NULL,
    content     TEXT        NOT NULL,
    author_id   VARCHAR(36) NOT NULL,
    is_accepted BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
