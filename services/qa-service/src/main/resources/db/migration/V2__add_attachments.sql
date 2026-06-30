CREATE TABLE question_attachments (
    question_id  VARCHAR(36)  NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    attachment_url VARCHAR(500) NOT NULL
);

CREATE TABLE answer_attachments (
    answer_id    VARCHAR(36)  NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    attachment_url VARCHAR(500) NOT NULL
);
