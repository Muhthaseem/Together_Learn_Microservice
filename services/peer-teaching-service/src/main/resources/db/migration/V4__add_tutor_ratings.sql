CREATE TABLE tutor_ratings (
    id          BIGSERIAL   PRIMARY KEY,
    rating_id   VARCHAR(36) NOT NULL UNIQUE,
    session_id  VARCHAR(36) NOT NULL UNIQUE REFERENCES tutoring_sessions(session_id) ON DELETE CASCADE,
    tutor_id    VARCHAR(36) NOT NULL,
    student_id  VARCHAR(36) NOT NULL,
    rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE tutor_stats (
    tutor_id       VARCHAR(36)    PRIMARY KEY,
    average_rating DECIMAL(3, 2)  NOT NULL DEFAULT 0.00,
    rating_count   INT            NOT NULL DEFAULT 0
);
