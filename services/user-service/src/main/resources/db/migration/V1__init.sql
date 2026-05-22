CREATE TABLE users (
    id                  BIGSERIAL    PRIMARY KEY,
    user_id             VARCHAR(36)  NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    registration_number VARCHAR(50)  UNIQUE,
    index_number        VARCHAR(50)  UNIQUE,
    department          VARCHAR(255),
    batch               VARCHAR(255),
    avatar_url          VARCHAR(500),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE user_courses (
    user_id     VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, course_code)
);
