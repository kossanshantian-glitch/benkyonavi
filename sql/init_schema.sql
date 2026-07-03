-- Initial database schema definitions

CREATE TABLE IF NOT EXISTS questions (
  qid INTEGER PRIMARY KEY,
  question_text TEXT NOT NULL,
  choices TEXT[] NOT NULL,
  correct_index INTEGER NOT NULL,
  category TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
