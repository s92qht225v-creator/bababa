// ─────────────────────────────────────────
// Shared enums / union types
// ─────────────────────────────────────────
export type Locale = 'uz' | 'zh' | 'ru'
export type UserRole = 'worker' | 'employer' | 'admin'
export type JobStatus = 'active' | 'paused' | 'closed'
export type ApplicationStatus = 'applied' | 'viewed' | 'shortlisted' | 'rejected' | 'hired'
export type AvailabilityStatus = 'available' | 'available_from' | 'unavailable'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'seasonal'
export type Gender = 'male' | 'female' | 'other'
export type CompanyVerificationStatus = 'pending' | 'verified' | 'rejected'
export type WorkerVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

// ─────────────────────────────────────────
// Helper types
// ─────────────────────────────────────────
export interface LocalizedField {
  uz: string | null
  zh: string | null
  ru: string | null
}

// ─────────────────────────────────────────
// Database row types
// ─────────────────────────────────────────
export interface Location {
  id: string
  region: string
  city: string
  district: string | null
  created_at: string
}

export interface JobCategory {
  id: string
  name_zh: string
  name_uz: string
  name_ru: string
  icon: string | null
  slug: string
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  role: UserRole
  language_preference: Locale
  avatar_url: string | null
  is_verified: boolean
  is_active: boolean
  telegram_id: string | null
  created_at: string
  updated_at: string
}

export interface WorkerProfile {
  id: string
  user_id: string
  slug: string
  age: number | null
  gender: Gender | null
  location_id: string | null
  profession: string
  category_id: string | null
  hsk_level: number
  languages: string[]
  experience_years: number
  skills: string[]
  expected_salary_min: number | null
  expected_salary_max: number | null
  salary_currency: string
  availability_status: AvailabilityStatus
  available_from: string | null
  bio_original: string | null
  bio_zh: string | null
  bio_uz: string | null
  bio_ru: string | null
  source_language: string
  photo_url: string | null
  video_url: string | null
  experience_history: ExperienceEntry[]
  bio_translation_status: 'complete' | 'failed' | 'pending'
  is_public: boolean
  is_verified: boolean
  verification_status: WorkerVerificationStatus
  last_active: string
  created_at: string
}

export interface ExperienceEntry {
  company: string
  title: string
  from: string
  to: string
  description: string
}

export interface Company {
  id: string
  user_id: string
  slug: string
  name_original: string
  name_zh: string | null
  name_uz: string | null
  name_ru: string | null
  logo_url: string | null
  industry: string | null
  description_zh: string | null
  description_uz: string | null
  description_ru: string | null
  website: string | null
  established_year: number | null
  employee_count: string | null
  is_verified: boolean
  verification_status: CompanyVerificationStatus
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  category_id: string | null
  location_id: string | null
  slug: string
  title_original: string
  title_zh: string | null
  title_uz: string | null
  title_ru: string | null
  description_original: string | null
  description_zh: string | null
  description_uz: string | null
  description_ru: string | null
  source_language: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  hsk_required: number
  experience_years: number
  employment_type: EmploymentType | null
  workers_needed: number
  benefits: string[]
  deadline: string | null
  status: JobStatus
  views_count: number
  translation_status: 'complete' | 'failed' | 'pending'
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_id: string
  worker_id: string
  cover_note: string | null
  status: ApplicationStatus
  applied_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  job_id: string | null
  body_original: string
  body_zh: string | null
  body_uz: string | null
  body_ru: string | null
  source_language: string
  is_read: boolean
  created_at: string
}

export interface TranslationCacheRow {
  id: string
  source_hash: string
  source_lang: string
  target_lang: string
  translated_text: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string | null
  body: string | null
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface SavedJob {
  id: string
  worker_id: string
  job_id: string
  created_at: string
}

export interface SavedWorker {
  id: string
  employer_id: string
  worker_id: string
  created_at: string
}

// ─────────────────────────────────────────
// Joined / enriched types
// ─────────────────────────────────────────
export type JobWithRelations = Job & {
  company: Company
  location: Location | null
  category: JobCategory | null
  _count?: { applications: number }
}

export type WorkerWithRelations = WorkerProfile & {
  profile: Profile
  location: Location | null
  category: JobCategory | null
}

// ─────────────────────────────────────────
// Translation helper types
// ─────────────────────────────────────────
export interface TranslatedJob {
  title_zh: string
  title_uz: string
  title_ru: string
  description_zh: string
  description_uz: string
  description_ru: string
}

export interface TranslatedBio {
  bio_zh: string
  bio_uz: string
  bio_ru: string
}

// ─────────────────────────────────────────
// Admin types
// ─────────────────────────────────────────
export interface TranslationOverride {
  id: string
  term_en: string
  term_zh: string | null
  term_uz: string | null
  term_ru: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MessageReport {
  id: string
  message_id: string
  reported_by: string
  reason: string
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}
