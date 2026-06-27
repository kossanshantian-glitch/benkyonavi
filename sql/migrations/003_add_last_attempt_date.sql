-- Track last attempt date for today-plan display
ALTER TABLE question_summary
  ADD COLUMN IF NOT EXISTS last_attempt_date DATE;
