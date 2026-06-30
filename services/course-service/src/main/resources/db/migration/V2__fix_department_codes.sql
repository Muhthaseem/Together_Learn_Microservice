-- Backfill rows that were seeded with the wrong department value ("courses").
-- Derive the correct abbreviated code from the course_code prefix.
UPDATE courses
SET department = CASE
    WHEN course_code LIKE 'CO%' THEN 'CO'
    WHEN course_code LIKE 'CE%' THEN 'CE'
    WHEN course_code LIKE 'EE%' THEN 'EEE'
    WHEN course_code LIKE 'ME%' THEN 'ME'
    WHEN course_code LIKE 'IS%' THEN 'First Year'
    ELSE department
END
WHERE department = 'courses';
