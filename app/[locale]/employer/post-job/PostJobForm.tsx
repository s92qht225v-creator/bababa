'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createJob, updateJob } from '@/lib/actions/jobs'
import { useUser } from '@/hooks/useUser'
import type { JobCategory, Location, Locale, EmploymentType, Job } from '@/types'

const BENEFITS_KEYS = [
  'housing',
  'meals',
  'transport',
  'health_insurance',
  'visa_assistance',
  'training',
  'bonus',
] as const

const EXPERIENCE_OPTIONS = [
  { value: 0, key: 'no_experience' },
  { value: 1, key: 'year_1' },
  { value: 2, key: 'years_2' },
  { value: 3, key: 'years_3' },
  { value: 5, key: 'years_5' },
]

interface PostJobFormProps {
  categories: JobCategory[]
  regions: string[]
  editJob?: Job & { location?: Location | null }
}

export function PostJobForm({ categories, regions, editJob }: PostJobFormProps) {
  const t = useTranslations('jobs')
  const locale = useLocale() as Locale
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()

  const isEditing = !!editJob

  // Form state
  const [title, setTitle] = useState(editJob?.title_original ?? '')
  const [categoryId, setCategoryId] = useState(editJob?.category_id ?? '')
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    editJob?.employment_type ?? 'full_time'
  )
  const [workersNeeded, setWorkersNeeded] = useState(editJob?.workers_needed ?? 1)
  const [deadline, setDeadline] = useState(editJob?.deadline ?? '')
  const [hskRequired, setHskRequired] = useState(editJob?.hsk_required ?? 0)
  const [experienceYears, setExperienceYears] = useState(editJob?.experience_years ?? 0)
  const [salaryMin, setSalaryMin] = useState<string>(
    editJob?.salary_min?.toString() ?? ''
  )
  const [salaryMax, setSalaryMax] = useState<string>(
    editJob?.salary_max?.toString() ?? ''
  )
  const [salaryCurrency, setSalaryCurrency] = useState(
    editJob?.salary_currency ?? 'USD'
  )
  const [benefits, setBenefits] = useState<string[]>(editJob?.benefits ?? [])
  const [description, setDescription] = useState(
    editJob?.description_original ?? ''
  )
  const [sourceLanguage, setSourceLanguage] = useState<Locale>(
    (editJob?.source_language as Locale) ?? locale
  )

  // Location state
  const [selectedRegion, setSelectedRegion] = useState(
    editJob?.location?.region ?? ''
  )
  const [selectedCity, setSelectedCity] = useState(
    editJob?.location?.city ?? ''
  )
  const [selectedDistrict, setSelectedDistrict] = useState(
    editJob?.location?.district ?? ''
  )
  const [cities, setCities] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [locationId, setLocationId] = useState(editJob?.location_id ?? '')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load cities when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setCities([])
      setSelectedCity('')
      setDistricts([])
      setSelectedDistrict('')
      setLocationId('')
      return
    }
    supabase
      .from('locations')
      .select('city')
      .eq('region', selectedRegion)
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((l) => l.city))]
        setCities(unique)
      })
  }, [selectedRegion, supabase])

  // Load districts when city changes
  useEffect(() => {
    if (!selectedCity || !selectedRegion) {
      setDistricts([])
      setSelectedDistrict('')
      return
    }
    supabase
      .from('locations')
      .select('id, district')
      .eq('region', selectedRegion)
      .eq('city', selectedCity)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const withDistricts = data.filter((l) => l.district)
          setDistricts(withDistricts.map((l) => l.district!))
          // If no districts, use the first location ID
          if (withDistricts.length === 0) {
            setLocationId(data[0].id)
          }
        }
      })
  }, [selectedCity, selectedRegion, supabase])

  // Resolve location ID when district changes
  useEffect(() => {
    if (!selectedDistrict || !selectedCity || !selectedRegion) return
    supabase
      .from('locations')
      .select('id')
      .eq('region', selectedRegion)
      .eq('city', selectedCity)
      .eq('district', selectedDistrict)
      .single()
      .then(({ data }) => {
        if (data) setLocationId(data.id)
      })
  }, [selectedDistrict, selectedCity, selectedRegion, supabase])

  // For no-district case: resolve when city is selected
  const resolveLocationByCity = useCallback(async () => {
    if (!selectedCity || !selectedRegion || districts.length > 0) return
    const { data } = await supabase
      .from('locations')
      .select('id')
      .eq('region', selectedRegion)
      .eq('city', selectedCity)
      .limit(1)
      .single()
    if (data) setLocationId(data.id)
  }, [selectedCity, selectedRegion, districts, supabase])

  useEffect(() => {
    resolveLocationByCity()
  }, [resolveLocationByCity])

  const toggleBenefit = (b: string) => {
    setBenefits((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Title is required')
    if (!categoryId) return setError('Category is required')
    if (!locationId) return setError('Location is required')
    if (description.length < 50) return setError('Description must be at least 50 characters')
    if (description.length > 3000) return setError('Description must be under 3000 characters')
    if (salaryMax && salaryMin && Number(salaryMax) < Number(salaryMin)) {
      return setError('Max salary must be >= min salary')
    }

    setSubmitting(true)

    const payload = {
      title: title.trim(),
      categoryId,
      employmentType,
      workersNeeded,
      deadline: deadline || null,
      locationId,
      hskRequired,
      experienceYears,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      salaryCurrency,
      benefits,
      description: description.trim(),
      sourceLanguage,
    }

    try {
      const result = isEditing
        ? await updateJob(
            editJob.id,
            payload,
            editJob.title_original,
            editJob.description_original ?? ''
          )
        : await createJob(payload)

      if (result.success) {
        router.push(`/${locale}/employer/dashboard?success=${isEditing ? 'updated' : 'created'}`)
      } else {
        setError(result.error ?? 'Something went wrong')
        setSubmitting(false)
      }
    } catch {
      setError('Something went wrong')
      setSubmitting(false)
    }
  }

  const categoryName = (cat: JobCategory) => {
    const field = `name_${locale}` as keyof JobCategory
    return (cat[field] as string) ?? cat.name_uz
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">
        {isEditing ? t('edit_job') : t('post_job')}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <section className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('job_title')} *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('category')} *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            required
          >
            <option value="">{t('select_category')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryName(cat)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t('employment_type')} *</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['full_time', 'part_time', 'contract', 'seasonal'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEmploymentType(type)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  employmentType === type
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('workers_needed')} *</label>
            <input
              type="number"
              min={1}
              value={workersNeeded}
              onChange={(e) => setWorkersNeeded(Number(e.target.value) || 1)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('deadline')}</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Location */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('location')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('region')} *</label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value)
                setSelectedCity('')
                setSelectedDistrict('')
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            >
              <option value="">{t('select_region')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('city')} *</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                setSelectedDistrict('')
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={!selectedRegion}
              required
            >
              <option value="">{t('select_city')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('district')}</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={districts.length === 0}
            >
              <option value="">{t('select_district')}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section 3: Requirements */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('requirements')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('hsk_required')} *</label>
            <select
              value={hskRequired}
              onChange={(e) => setHskRequired(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value={0}>{t('hsk_none')}</option>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <option key={level} value={level}>
                  HSK {level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('experience')} *</label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.key)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section 4: Salary */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('salary_range')}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('salary_min')}</label>
            <input
              type="number"
              min={0}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('salary_max')}</label>
            <input
              type="number"
              min={0}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('currency')}</label>
            <div className="flex gap-2 pt-1">
              {['USD', 'UZS'].map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setSalaryCurrency(cur)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    salaryCurrency === cur
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Benefits */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('benefits')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BENEFITS_KEYS.map((b) => (
            <label
              key={b}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                benefits.includes(b)
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={benefits.includes(b)}
                onChange={() => toggleBenefit(b)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  benefits.includes(b)
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-gray-400'
                }`}
              >
                {benefits.includes(b) && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {t(b)}
            </label>
          ))}
        </div>
      </section>

      {/* Section 6: Description */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('description')}</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('description_placeholder')}
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          required
          minLength={50}
          maxLength={3000}
        />
        <p className={`text-right text-xs ${description.length > 3000 ? 'text-red-500' : 'text-gray-400'}`}>
          {t('char_count', { count: description.length, max: 3000 })}
        </p>
      </section>

      {/* Section 7: Source language */}
      <section className="space-y-2">
        <label className="block text-sm font-medium">{t('written_in')}</label>
        <div className="flex gap-4">
          {(['zh', 'uz', 'ru'] as const).map((lang) => (
            <label key={lang} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="sourceLanguage"
                value={lang}
                checked={sourceLanguage === lang}
                onChange={() => setSourceLanguage(lang)}
                className="text-red-600"
              />
              {lang === 'zh' ? '中文' : lang === 'uz' ? "O'zbekcha" : 'Русский'}
            </label>
          ))}
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? t('translating')
          : isEditing
            ? t('update_job')
            : t('publish_job')}
      </button>
    </form>
  )
}
