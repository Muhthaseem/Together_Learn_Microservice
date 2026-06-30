CREATE TABLE courses (
    id          BIGSERIAL    PRIMARY KEY,
    course_code VARCHAR(50)  NOT NULL UNIQUE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    department  VARCHAR(255) NOT NULL,
    semester    INTEGER,
    credits     INTEGER,
    pre_reqs    VARCHAR(500)
);
