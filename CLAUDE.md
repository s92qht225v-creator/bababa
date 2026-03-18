# CLAUDE.md - Bababa Developer Reference

## Project Overview

Bababa is a trilingual job marketplace connecting Chinese companies operating in Uzbekistan with local workers. The platform supports three user roles (worker, employer, admin) and three locales (Uzbek, Chinese, Russian). All user-generated content (job posts, bios, messages) is automatically translated across all three languages using GPT-4o-mini.

**Tech stack:** Next.js 15 (App Router), React 19, Supabase (Auth, Postgres, Realtime, Storage), OpenAI GPT-4o-mini, Tailwind CSS v4, next-intl, Vercel.

## Architecture

- **Routing:** Next.js 15 App Router with `next-intl` v4. All routes are under `app/[locale]/`. Locale prefix is always shown (`localePrefix: 'always'`). Default locale: `uz`.
- **Locales:** `uz` (Uzbek), `zh` (Chinese), `ru` (Russian). Static UI strings live in `messages/{uz,zh,ru}.json`. Dynamic content is translated via OpenAI.
- **Auth & roles:** Supabase Auth. Middleware (`middleware.ts`) handles locale routing, auth redirects, and role enforcement (worker/employer/admin). Public pages skip auth checks entirely for performance.
- **Database:** Supabase Postgres with RLS. Admin access uses an `is_admin()` SECURITY DEFINER function.
- **Translations:** `lib/translate.ts` uses GPT-4o-mini. Results are cached in a `translation_cache` table keyed by source hash. Uses `.maybeSingle()` for cache lookups.
- **Deployment:** Vercel, function region Mumbai (bom1). ISR for public pages (revalidate 60-86400s).

## Key Patterns

### Server Components vs Client Components
Server components are the default. Client components use `'use client'` directive and are kept to interactive leaves (forms, modals, real-time features). The root layout is a server component that wraps children in `NextIntlClientProvider` and `UserProvider`.

### Supabase Client Creation
Two factory functions in `lib/supabase/server.ts`:
- **`createClient()`** -- Uses `cookies()`, ties request to user session. Use for protected pages and server actions. Opts route into dynamic rendering.
- **`createPublicClient()`** -- No cookies, returns empty cookie jar. Use for public pages (jobs list, worker profiles, company pages, home). Enables ISR caching.

### Server Action Pattern
Files in `lib/actions/` follow this structure:
```
'use server'
1. Import createClient from lib/supabase/server
2. Authenticate: supabase.auth.getUser()
3. Validate input
4. Execute DB query/mutation
5. revalidatePath() if data changed
6. Return { success: boolean, error?: string }
```

### Translation Pattern
`lib/translate.ts` handles all dynamic content translation:
- Computes SHA-256 hash of source text
- Checks `translation_cache` table with `.maybeSingle()` (returns null on miss, no error)
- On cache miss, calls GPT-4o-mini and stores result
- Translates jobs (title + description), bios, and chat messages

### Location Names
`lib/location-names.ts` contains static mappings of city/region names in all three locales. Locations are stored in DB with English keys; display names are resolved client-side via `getLocalizedCity()` / `getLocalizedRegion()`. Do NOT add locale columns to the locations table.

### ISR Caching
Public pages use `createPublicClient()` and export `revalidate` constants (60-86400 seconds). This avoids calling `cookies()` so Next.js can cache the page at the edge.

## Directory Structure

```
app/[locale]/
  page.tsx              # Home page
  about/                # About page
  auth/                 # Login, register
  jobs/                 # Job listings, detail pages
  workers/              # Worker directory
  companies/            # Company directory
  how-it-works/         # Info page
  worker/               # Protected: worker dashboard, profile, messages
  employer/             # Protected: employer dashboard, jobs, messages
  admin/                # Protected: admin dashboard, moderation
components/
  ui/                   # Reusable UI (Toast, buttons, inputs)
  layout/               # Header, Footer
  home/                 # Home page sections
  jobs/                 # Job cards, filters
  workers/              # Worker cards
  companies/            # Company cards
  messages/             # Chat UI
  notifications/        # Notification components
  employer/             # Employer-specific components
  admin/                # Admin-specific components
  applicants/           # Application management
  applications/         # Worker's application views
  seo/                  # JSON-LD structured data
lib/
  supabase/server.ts    # createClient(), createPublicClient()
  actions/              # Server actions (admin, auth, company, jobs, messages, worker, etc.)
  translate.ts          # GPT-4o-mini translation with caching
  location-names.ts     # Static localized city/region names
  seo.ts                # SEO metadata helpers
  slugify.ts            # Slug generation
  utils.ts              # General utilities (cn, formatting)
messages/
  uz.json, zh.json, ru.json   # Static UI translation strings
i18n/
  routing.ts            # next-intl config (locales, default, navigation helpers)
  request.ts            # Server-side locale resolution
types/
  index.ts              # All TypeScript types and interfaces
supabase/
  migrations/           # Sequential SQL migrations (001_ through 009_)
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous/public key
OPENAI_API_KEY                 # OpenAI API key (for GPT-4o-mini translations)
NEXT_PUBLIC_SITE_URL           # Public site URL (used for SEO, sitemap)
```

## Database

### Key Tables
- `profiles` -- User identity (role, name, phone, language preference, is_active)
- `worker_profiles` -- Worker details (profession, skills, HSK level, bio in 3 languages, experience history)
- `companies` -- Employer companies (name/description in 3 languages, verification status)
- `jobs` -- Job postings (title/description in 3 languages, salary, requirements, status)
- `job_categories` -- Predefined categories with trilingual names
- `locations` -- Uzbekistan cities/regions (English keys, localized via `lib/location-names.ts`)
- `applications` -- Worker-to-job applications with status tracking
- `messages` -- Direct messages with trilingual body fields
- `translation_cache` -- Cached GPT translations keyed by source hash
- `notifications` -- In-app notifications
- `saved_jobs` / `saved_workers` -- Bookmarks
- `message_reports` -- Flagged messages for admin review
- `translation_overrides` -- Admin-managed term translations

### RLS & Admin
All tables use Row Level Security. Admin queries use an `is_admin()` SECURITY DEFINER function to bypass RLS safely. Migrations are in `supabase/migrations/` numbered sequentially.

## Common Tasks

### Adding a New Page
1. Create `app/[locale]/your-page/page.tsx`
2. Add `setRequestLocale(locale)` at the top of the component for static generation
3. Use `createPublicClient()` for public pages, `createClient()` for protected ones
4. Add translation keys to all three `messages/*.json` files
5. For protected pages, middleware already handles auth based on route prefix (`/worker/`, `/employer/`, `/admin/`)

### Adding a Translation Key
1. Add the key to `messages/uz.json`, `messages/zh.json`, and `messages/ru.json`
2. Use `useTranslations('namespace')` in client components or `getTranslations('namespace')` in server components

### Adding a New Location
1. Add entries to `REGION_NAMES` and/or `CITY_NAMES` in `lib/location-names.ts`
2. Insert the corresponding row into the `locations` table (use English name as the key)
3. Do NOT add locale columns to the locations table

### Running Migrations
1. Create a new file `supabase/migrations/NNN_description.sql`
2. Run `supabase db push` or apply via the Supabase dashboard

## Conventions

- **Theme:** Red accent (bg-red-600, text-red-700, hover:bg-red-700)
- **CSS:** Tailwind CSS v4 with `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge)
- **Fonts:** Inter for Latin/Cyrillic; Noto Sans SC conditionally loaded for `zh` locale only
- **Server actions** return `{ success: boolean, error?: string }`
- **DB lookups:** Use `.maybeSingle()` not `.single()` for optional/nullable results
- **Public pages** use `createPublicClient()` to enable ISR caching
- **Locations** are localized via `lib/location-names.ts` static maps, not DB columns
- **Navigation:** Import `Link`, `redirect`, `useRouter` from `@/i18n/routing` (not from `next/link` or `next/navigation`)
- **Types:** All shared types are in `types/index.ts`. Use `Locale`, `UserRole`, `JobStatus`, etc. from there.
- **Slugs:** Generated via `lib/slugify.ts` for SEO-friendly URLs on jobs, workers, and companies
