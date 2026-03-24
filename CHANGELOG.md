# Changelog

## 2026-03-24

### Bug Fixes
- **Applicants page crash** — `useSearchParams()` without Suspense boundary caused "Application error" on `/employer/applicants` and both messages pages. Added `<Suspense>` wrappers.
- **Notifications not created** — Missing RLS INSERT policy on `notifications` table silently blocked all notification inserts (job applications, status changes, messages).
- **Employer can't see applicant profiles** — `worker_profiles` RLS only allowed `is_public = true`. Added `SECURITY DEFINER` function `is_employer_of_applicant()` so employers can view profiles of workers who applied to their jobs.
- **Applicant card crash** — `applicant.worker` could be `null` when RLS blocked the join. Added null safety throughout `ApplicantCard` and `ApplicantKanban`.
- **Worker profile 404 for employers** — Private worker profiles returned 404 even for employers viewing their applicants. Added employer access check.
- **Login/register auth cookie race condition** — `router.push()` after server action sometimes navigated before the cookie was ready, showing blank dashboard. Replaced with `window.location.href` for full-page navigation.
- **Logout changes language** — `signOut` redirected to `/` which triggered browser language detection, switching to Chinese. Now redirects to `/{locale}`.
- **Message source language wrong** — Messages tagged with stored `language_preference` instead of current URL locale. Chinese messages sent from `/zh/` were tagged as Uzbek.
- **Worker `last_active` stale** — Only updated on profile save. Now also updates on login and dashboard visit.
- **Playwright test selectors** — Fixed 35+ broken E2E tests caused by strict mode violations (`getByText` matching multiple elements).
- **RLS infinite recursion** — Direct subquery in employer SELECT policy on `worker_profiles` caused recursive RLS evaluation. Fixed with `SECURITY DEFINER` function.
- **Profile save error** — Caused by the recursive RLS policy. Error message now shows actual Supabase error for easier debugging.
- **District dropdown disabled** — Tuman dropdown appeared disabled for most cities. Now hidden when no districts are available.

### Features
- **View applicant profile** — Employer can click applicant name or "View Profile" button to see full worker profile in new tab.
- **Mobile workers page filters** — Category, region, HSK level, and availability filters were missing on mobile. Added compact pill-style filter buttons.
- **25 new cities** — Added Qo'qon, Bekobod, Ohangaron, Nurafshon, Xonobod, Muborak, and more across all regions.
- **"Other" city option** — Every region now has an "Other" fallback for unlisted cities.
- **12 Tashkent districts** — All districts with correct Uzbek spelling: Bektemir, Mirobod, Mirzo Ulug'bek, Olmazor, Sergeli, Uchtepa, Yakkasaroy, Yangihayot, Yashnobod, Yunusobod, Shayxontohur, Chilonzor.
- **District translations** — Trilingual district names (UZ/ZH/RU) for Tashkent and Samarkand.
- **Playwright E2E test suite** — 52 tests covering public pages, auth, employer/worker flows, mobile, navigation, and search.

### UI Improvements
- **Typography** — Swapped Inter for DM Sans (Latin/Uzbek), Source Sans 3 (Cyrillic/Russian), Noto Sans SC (Chinese).
- **Glass header** — Backdrop blur with semi-transparent background.
- **Card hover animations** — Subtle lift + shadow on hover for all cards.
- **Hero section** — Larger typography, decorative gradient blur orbs, card-style search bar.
- **Buttons** — Rounded-xl with colored shadows, outline-to-filled hover transitions.
- **Category cards** — Icon backgrounds, rounded-2xl, lift animation.
- **Job cards** — Rounded-2xl, card-hover effect, softer borders.
- **Stats counter** — Gradient text effect.
- **Testimonials** — Floating decorative quote marks.
- **CTA banner** — Atmospheric blur elements for depth.
- **Footer** — Section headers with uppercase tracking, softer palette.
- **Login/Register** — Card wrapper with rounded-2xl and shadow, larger inputs with gray-50 fill.
- **Pagination** — Pill-style page indicator.

### Performance
- **Removed `output: 'standalone'`** — Re-enables Vercel static optimization and edge caching.
- **Font `display: 'swap'`** — Prevents render-blocking while fonts load.
- **Cyrillic font fix** — Russian text no longer falls back to system fonts.

### Database Migrations
- `011` — Notifications INSERT policy for authenticated users
- `012` — `is_employer_of_applicant()` function + employer SELECT policy on worker_profiles
- `013` — 25 new cities + "Other" fallback per region
- `014` — 12 Tashkent districts with correct Uzbek spelling
