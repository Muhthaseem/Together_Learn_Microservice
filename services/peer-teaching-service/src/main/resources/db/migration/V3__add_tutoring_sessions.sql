CREATE TABLE tutoring_sessions (
    id                  BIGSERIAL    PRIMARY KEY,
    session_id          VARCHAR(36)  NOT NULL UNIQUE,
    request_id          VARCHAR(36)  NOT NULL,
    application_id      VARCHAR(36)  NOT NULL UNIQUE,
    tutor_id            VARCHAR(36)  NOT NULL,
    student_id          VARCHAR(36)  NOT NULL,
    session_date        DATE         NOT NULL,
    session_time        TIME         NOT NULL,
    duration_minutes    INT          NOT NULL DEFAULT 60,
    mode                VARCHAR(10)  NOT NULL,
    meeting_link        VARCHAR(500),
    location            VARCHAR(255),
    status              VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    cancellation_reason VARCHAR(500),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
