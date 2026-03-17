-- Add translation_status column to jobs table
ALTER TABLE jobs ADD COLUMN translation_status text DEFAULT 'complete'
  CHECK (translation_status IN ('complete', 'failed', 'pending'));
