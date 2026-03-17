-- Soft delete / suspend support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Company verification status
ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  verification_status text DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Backfill existing verified companies
UPDATE companies SET verification_status = 'verified' WHERE is_verified = true;

-- Worker verification status
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS
  verification_status text DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Backfill existing verified workers
UPDATE worker_profiles SET verification_status = 'verified' WHERE is_verified = true;

-- Translation overrides
CREATE TABLE IF NOT EXISTS translation_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_en     text NOT NULL,
  term_zh     text,
  term_uz     text,
  term_ru     text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Message reports
CREATE TABLE IF NOT EXISTS message_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid REFERENCES messages(id) ON DELETE CASCADE,
  reported_by  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason       text NOT NULL,
  status       text DEFAULT 'pending'
               CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by  uuid REFERENCES profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(message_id, reported_by)
);

-- RLS for translation_overrides
ALTER TABLE translation_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translation overrides"
  ON translation_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin full access translation_overrides"
  ON translation_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS for message_reports
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report messages"
  ON message_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can manage reports"
  ON message_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin RLS policies for existing tables
CREATE POLICY "Admin full access profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin full access companies"
  ON companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access worker_profiles"
  ON worker_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access jobs"
  ON jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Analytics functions
CREATE OR REPLACE FUNCTION registrations_per_day(days integer DEFAULT 30)
RETURNS TABLE(day date, count bigint) AS $$
  SELECT date_trunc('day', created_at)::date AS day, count(*)
  FROM profiles
  WHERE created_at >= now() - (days || ' days')::interval
  GROUP BY day ORDER BY day;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION applications_per_day(days integer DEFAULT 30)
RETURNS TABLE(day date, count bigint) AS $$
  SELECT date_trunc('day', applied_at)::date AS day, count(*)
  FROM applications
  WHERE applied_at >= now() - (days || ' days')::interval
  GROUP BY day ORDER BY day;
$$ LANGUAGE sql SECURITY DEFINER;

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_verification_status ON worker_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
