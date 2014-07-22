CREATE TYPE repress_type AS ENUM ('posemo', 'negemo');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  username TEXT UNIQUE NOT NULL,
  repress repress_type NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  access_token TEXT,
  administrator BOOLEAN DEFAULT FALSE,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE INDEX users_username_index ON users(username);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,

  user_id INTEGER REFERENCES users(id) NOT NULL,

  author TEXT,
  content TEXT NOT NULL,
  repressed TEXT,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE surveys (
  id SERIAL PRIMARY KEY,

  access_token TEXT,
  repress TEXT,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);
