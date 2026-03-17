-- ═══════════════════════════════════════════════════════════
-- bababa (888) — Initial Schema
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- LOCATIONS
-- ───────────────────────────────────────────
CREATE TABLE locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region      text NOT NULL,
  city        text NOT NULL,
  district    text,
  created_at  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- JOB CATEGORIES
-- ───────────────────────────────────────────
CREATE TABLE job_categories (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh  text NOT NULL,
  name_uz  text NOT NULL,
  name_ru  text NOT NULL,
  icon     text,
  slug     text UNIQUE NOT NULL
);

-- ───────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ───────────────────────────────────────────
CREATE TABLE profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text NOT NULL,
  phone               text,
  role                text NOT NULL CHECK (role IN ('worker', 'employer', 'admin')),
  language_preference text DEFAULT 'uz' CHECK (language_preference IN ('zh', 'uz', 'ru')),
  avatar_url          text,
  is_verified         boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- WORKER PROFILES
-- ───────────────────────────────────────────
CREATE TABLE worker_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug                 text UNIQUE NOT NULL,
  age                  integer,
  gender               text CHECK (gender IN ('male', 'female', 'other')),
  location_id          uuid REFERENCES locations(id),
  profession           text NOT NULL,
  category_id          uuid REFERENCES job_categories(id),
  hsk_level            integer DEFAULT 0 CHECK (hsk_level BETWEEN 0 AND 6),
  languages            text[] DEFAULT '{}',
  experience_years     integer DEFAULT 0,
  skills               text[] DEFAULT '{}',
  expected_salary_min  integer,
  expected_salary_max  integer,
  salary_currency      text DEFAULT 'USD',
  availability_status  text DEFAULT 'available'
                         CHECK (availability_status IN ('available', 'available_from', 'unavailable')),
  available_from       date,
  bio_original         text,
  bio_zh               text,
  bio_uz               text,
  bio_ru               text,
  source_language      text DEFAULT 'uz',
  photo_url            text,
  video_url            text,
  is_public            boolean DEFAULT true,
  is_verified          boolean DEFAULT false,
  last_active          timestamptz DEFAULT now(),
  created_at           timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- COMPANIES
-- ───────────────────────────────────────────
CREATE TABLE companies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug             text UNIQUE NOT NULL,
  name_original    text NOT NULL,
  name_zh          text,
  name_uz          text,
  name_ru          text,
  logo_url         text,
  industry         text,
  description_zh   text,
  description_uz   text,
  description_ru   text,
  website          text,
  established_year integer,
  employee_count   text,
  is_verified      boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- JOBS
-- ───────────────────────────────────────────
CREATE TABLE jobs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid REFERENCES companies(id) ON DELETE CASCADE,
  category_id          uuid REFERENCES job_categories(id),
  location_id          uuid REFERENCES locations(id),
  slug                 text UNIQUE NOT NULL,
  title_original       text NOT NULL,
  title_zh             text,
  title_uz             text,
  title_ru             text,
  description_original text,
  description_zh       text,
  description_uz       text,
  description_ru       text,
  source_language      text DEFAULT 'zh',
  salary_min           integer,
  salary_max           integer,
  salary_currency      text DEFAULT 'USD',
  hsk_required         integer DEFAULT 0 CHECK (hsk_required BETWEEN 0 AND 6),
  experience_years     integer DEFAULT 0,
  employment_type      text CHECK (employment_type IN
                         ('full_time', 'part_time', 'contract', 'seasonal')),
  workers_needed       integer DEFAULT 1,
  benefits             text[] DEFAULT '{}',
  deadline             date,
  status               text DEFAULT 'active'
                         CHECK (status IN ('active', 'paused', 'closed')),
  views_count          integer DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- APPLICATIONS
-- ───────────────────────────────────────────
CREATE TABLE applications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id  uuid REFERENCES worker_profiles(id) ON DELETE CASCADE,
  cover_note text,
  status     text DEFAULT 'applied'
               CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'hired')),
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- ───────────────────────────────────────────
-- MESSAGES
-- ───────────────────────────────────────────
CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id          uuid REFERENCES jobs(id) ON DELETE SET NULL,
  body_original   text NOT NULL,
  body_zh         text,
  body_uz         text,
  body_ru         text,
  source_language text NOT NULL,
  is_read         boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- TRANSLATION CACHE
-- ───────────────────────────────────────────
CREATE TABLE translation_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash     text NOT NULL,
  source_lang     text NOT NULL,
  target_lang     text NOT NULL,
  translated_text text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(source_hash, source_lang, target_lang)
);

-- ───────────────────────────────────────────
-- NOTIFICATIONS
-- ───────────────────────────────────────────
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text,
  body       text,
  payload    jsonb DEFAULT '{}',
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────
-- SAVED JOBS (workers bookmark jobs)
-- ───────────────────────────────────────────
CREATE TABLE saved_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     uuid REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(worker_id, job_id)
);

-- ───────────────────────────────────────────
-- SAVED WORKERS (employers bookmark workers)
-- ───────────────────────────────────────────
CREATE TABLE saved_workers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id   uuid REFERENCES worker_profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(employer_id, worker_id)
);


-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── WORKER PROFILES ──
CREATE POLICY "worker_profiles_select_public" ON worker_profiles
  FOR SELECT USING (is_public = true);
CREATE POLICY "worker_profiles_select_own" ON worker_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "worker_profiles_insert_own" ON worker_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "worker_profiles_update_own" ON worker_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "worker_profiles_delete_own" ON worker_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ── COMPANIES ──
CREATE POLICY "companies_select_all" ON companies
  FOR SELECT USING (true);
CREATE POLICY "companies_insert_own" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_delete_own" ON companies
  FOR DELETE USING (auth.uid() = user_id);

-- ── JOBS ──
CREATE POLICY "jobs_select_active" ON jobs
  FOR SELECT USING (status = 'active');
CREATE POLICY "jobs_select_own" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c WHERE c.id = jobs.company_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c WHERE c.id = jobs.company_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies c WHERE c.id = jobs.company_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies c WHERE c.id = jobs.company_id AND c.user_id = auth.uid()
    )
  );

-- ── APPLICATIONS ──
CREATE POLICY "applications_select_worker" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM worker_profiles wp WHERE wp.id = applications.worker_id AND wp.user_id = auth.uid()
    )
  );
CREATE POLICY "applications_select_employer" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "applications_insert_worker" ON applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles wp WHERE wp.id = applications.worker_id AND wp.user_id = auth.uid()
    )
  );
CREATE POLICY "applications_update_employer" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id AND c.user_id = auth.uid()
    )
  );

-- ── MESSAGES ──
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert_sender" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── NOTIFICATIONS ──
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── SAVED JOBS ──
CREATE POLICY "saved_jobs_select_own" ON saved_jobs
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "saved_jobs_insert_own" ON saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "saved_jobs_delete_own" ON saved_jobs
  FOR DELETE USING (auth.uid() = worker_id);

-- ── SAVED WORKERS ──
CREATE POLICY "saved_workers_select_own" ON saved_workers
  FOR SELECT USING (auth.uid() = employer_id);
CREATE POLICY "saved_workers_insert_own" ON saved_workers
  FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "saved_workers_delete_own" ON saved_workers
  FOR DELETE USING (auth.uid() = employer_id);

-- ── TRANSLATION CACHE ──
CREATE POLICY "translation_cache_select_all" ON translation_cache
  FOR SELECT USING (true);
CREATE POLICY "translation_cache_insert_auth" ON translation_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── LOCATIONS ──
CREATE POLICY "locations_select_all" ON locations
  FOR SELECT USING (true);
CREATE POLICY "locations_admin_insert" ON locations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "locations_admin_update" ON locations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── JOB CATEGORIES ──
CREATE POLICY "job_categories_select_all" ON job_categories
  FOR SELECT USING (true);
CREATE POLICY "job_categories_admin_insert" ON job_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "job_categories_admin_update" ON job_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_slug ON jobs(slug);
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_location ON jobs(location_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_worker_profiles_slug ON worker_profiles(slug);
CREATE INDEX idx_worker_profiles_hsk ON worker_profiles(hsk_level);
CREATE INDEX idx_worker_profiles_availability ON worker_profiles(availability_status);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_translation_cache_lookup ON translation_cache(source_hash, source_lang, target_lang);


-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create a profiles row when a new Supabase auth user signs up.
-- The user metadata must contain: full_name, role, and optionally phone.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, language_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'uz')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Add telegram_id to profiles for Telegram OAuth login
ALTER TABLE profiles ADD COLUMN telegram_id text UNIQUE;
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
-- Add translation_status column to jobs table
ALTER TABLE jobs ADD COLUMN translation_status text DEFAULT 'complete'
  CHECK (translation_status IN ('complete', 'failed', 'pending'));
-- Work experience history
ALTER TABLE worker_profiles ADD COLUMN experience_history jsonb DEFAULT '[]';

-- Translation status on worker bio
ALTER TABLE worker_profiles ADD COLUMN bio_translation_status text DEFAULT 'complete'
  CHECK (bio_translation_status IN ('complete', 'failed', 'pending'));
-- Enable Supabase Realtime on messaging and notification tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- Composite index for conversation queries (find messages between two users for a job)
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(sender_id, receiver_id, job_id, created_at DESC);

-- Index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);
-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to company-logos
CREATE POLICY "Authenticated users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

-- Allow public read access to company logos
CREATE POLICY "Public can view company logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Allow authenticated users to update their own logos
CREATE POLICY "Authenticated users can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');
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
