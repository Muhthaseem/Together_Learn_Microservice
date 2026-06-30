CREATE TABLE peer_requests (
    id           BIGSERIAL    PRIMARY KEY,
    request_id   VARCHAR(36)  NOT NULL UNIQUE,
    requester_id VARCHAR(36)  NOT NULL,
    course_code  VARCHAR(50)  NOT NULL,
    topic        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE peer_offers (
    id          BIGSERIAL    PRIMARY KEY,
    offer_id    VARCHAR(36)  NOT NULL UNIQUE,
    tutor_id    VARCHAR(36)  NOT NULL,
    course_code VARCHAR(50)  NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE peer_applications (
    id             BIGSERIAL     PRIMARY KEY,
    application_id VARCHAR(36)   NOT NULL UNIQUE,
    request_id     VARCHAR(36)   NOT NULL,
    applicant_id   VARCHAR(36)   NOT NULL,
    message        VARCHAR(1000),
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    applied_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);
