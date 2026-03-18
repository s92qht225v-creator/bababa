-- Saved/bookmarked jobs for workers
CREATE TABLE saved_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id     uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job ON saved_jobs(job_id);
