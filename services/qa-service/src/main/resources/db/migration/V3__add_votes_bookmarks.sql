ALTER TABLE questions ADD COLUMN upvote_count INT NOT NULL DEFAULT 0;
ALTER TABLE answers  ADD COLUMN upvote_count INT NOT NULL DEFAULT 0;

CREATE TABLE question_votes (
    id          BIGSERIAL PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    user_id     VARCHAR(36) NOT NULL,
    vote_type   VARCHAR(4)  NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, user_id)
);

CREATE TABLE answer_votes (
    id          BIGSERIAL PRIMARY KEY,
    answer_id   VARCHAR(36) NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    user_id     VARCHAR(36) NOT NULL,
    vote_type   VARCHAR(4)  NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (answer_id, user_id)
);

CREATE TABLE bookmarks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, question_id)
);
