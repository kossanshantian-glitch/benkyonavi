-- Rank estimation tracking
ALTER TABLE history
  ADD COLUMN IF NOT EXISTS suggested_rank TEXT;

ALTER TABLE question_summary
  ADD COLUMN IF NOT EXISTS consecutive_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_wrong INTEGER NOT NULL DEFAULT 0;
