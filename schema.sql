CREATE TYPE repress_type AS ENUM ('posemo', 'negemo');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  email TEXT UNIQUE NOT NULL,
  repress repress_type NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,

  user_id INTEGER REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);
