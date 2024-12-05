-- initialize.sql

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255),
  points INTEGER DEFAULT 0
);
