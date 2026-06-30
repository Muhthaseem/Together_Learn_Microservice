ALTER TABLE peer_requests ADD COLUMN title VARCHAR(255);
ALTER TABLE peer_requests ADD COLUMN preferred_mode VARCHAR(10) NOT NULL DEFAULT 'BOTH';
ALTER TABLE peer_requests ADD COLUMN location VARCHAR(255);
ALTER TABLE peer_requests ADD COLUMN from_date DATE;
ALTER TABLE peer_requests ADD COLUMN to_date DATE;
ALTER TABLE peer_requests ADD COLUMN department VARCHAR(100);
