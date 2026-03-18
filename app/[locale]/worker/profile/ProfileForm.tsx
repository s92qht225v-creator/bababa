'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { saveWorkerProfile, updateProfilePhoto, updateProfileVideo } from '@/lib/actions/worker'
import type { Locale, AvailabilityStatus, ExperienceEntry, JobCategory, Location, WorkerProfile, Profile } from '@/types'

interface ProfileFormProps {
  locale: string
  profile: Pick<Profile, 'full_name' | 'phone' | 'language_preference'> | null
  workerProfile: WorkerProfile | null
  categories: JobCategory[]
  regions: string[]
  currentLocation: Location | null
}

const LANGUAGE_OPTIONS = ['uzbek', 'russian', 'english', 'korean', 'other'] as const

function calculateCompletion(wp: WorkerProfile | null, p: ProfileFormProps['profile']): number {
  if (!wp || !p) return 0
  let filled = 0
  let total = 10
  if (p.full_name) filled++
  if (p.phone) filled++
  if (wp.profession) filled++
  if (wp.category_id) filled++
  if (wp.location_id) filled++
  if (wp.experience_years > 0) filled++
  if (wp.skills && wp.skills.length > 0) filled++
  if (wp.hsk_level > 0) filled++
  if (wp.bio_original) filled++
  if (wp.photo_url) filled++
  return Math.round((filled / total) * 100)
}

export function ProfileForm({ locale, profile, workerProfile, categories, regions, currentLocation }: ProfileFormProps) {
  const t = useTranslations('worker')
  const currentLocale = useLocale() as Locale
  const supabase = createClient()

  // Personal info
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [age, setAge] = useState<number | ''>(workerProfile?.age ?? '')
  const [gender, setGender] = useState(workerProfile?.gender ?? '')

  // Location
  const [selectedRegion, setSelectedRegion] = useState(currentLocation?.region ?? '')
  const [selectedCity, setSelectedCity] = useState(currentLocation?.city ?? '')
  const [selectedDistrict, setSelectedDistrict] = useState(currentLocation?.district ?? '')
  const [cities, setCities] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [locationId, setLocationId] = useState(workerProfile?.location_id ?? '')

  // Professional
  const [profession, setProfession] = useState(workerProfile?.profession ?? '')
  const [categoryId, setCategoryId] = useState(workerProfile?.category_id ?? '')
  const [experienceYears, setExperienceYears] = useState(workerProfile?.experience_years ?? 0)
  const [skills, setSkills] = useState<string[]>(workerProfile?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')

  // Language
  const [hskLevel, setHskLevel] = useState(workerProfile?.hsk_level ?? 0)
  const [languages, setLanguages] = useState<string[]>(workerProfile?.languages ?? [])

  // Salary
  const [salaryMin, setSalaryMin] = useState<number | ''>(workerProfile?.expected_salary_min ?? '')
  const [salaryMax, setSalaryMax] = useState<number | ''>(workerProfile?.expected_salary_max ?? '')
  const [salaryCurrency, setSalaryCurrency] = useState(workerProfile?.salary_currency ?? 'UZS')

  // Availability
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(workerProfile?.availability_status ?? 'available')
  const [availableFrom, setAvailableFrom] = useState(workerProfile?.available_from ?? '')

  // Bio
  const [bioOriginal, setBioOriginal] = useState(workerProfile?.bio_original ?? '')
  const [sourceLanguage, setSourceLanguage] = useState<Locale>(workerProfile?.source_language as Locale ?? currentLocale)

  // Experience history
  const [experienceHistory, setExperienceHistory] = useState<ExperienceEntry[]>(workerProfile?.experience_history ?? [])

  // Visibility
  const [isPublic, setIsPublic] = useState(workerProfile?.is_public ?? false)

  // Photo & video
  const [photoUrl, setPhotoUrl] = useState(workerProfile?.photo_url ?? '')
  const [videoUrl, setVideoUrl] = useState(workerProfile?.video_url ?? '')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const isInitialMount = useRef(true)

  // Cascading location: Region → Cities
  useEffect(() => {
    if (!selectedRegion) {
      setCities([])
      setDistricts([])
      if (!isInitialMount.current) {
        setSelectedCity('')
        setSelectedDistrict('')
        setLocationId('')
      }
      return
    }
    supabase
      .from('locations')
      .select('city')
      .eq('region', selectedRegion)
      .order('city')
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((d) => d.city))]
        setCities(unique)
        if (!isInitialMount.current) {
          setSelectedCity('')
          setSelectedDistrict('')
          setLocationId('')
        }
      })
  }, [selectedRegion])

  // Cascading location: City → Districts
  useEffect(() => {
    if (!selectedRegion || !selectedCity) {
      setDistricts([])
      if (!isInitialMount.current) {
        setSelectedDistrict('')
        setLocationId('')
      }
      return
    }
    supabase
      .from('locations')
      .select('id, district')
      .eq('region', selectedRegion)
      .eq('city', selectedCity)
      .order('district')
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const hasDistricts = data.some((d) => d.district)
        if (!hasDistricts) {
          setLocationId(data[0].id)
          setDistricts([])
        } else {
          const unique = data.filter((d) => d.district).map((d) => d.district!)
          setDistricts([...new Set(unique)])
          if (!isInitialMount.current) {
            setSelectedDistrict('')
            setLocationId('')
          }
        }
      })
  }, [selectedRegion, selectedCity])

  // Cascading location: District → LocationId
  useEffect(() => {
    if (!selectedRegion || !selectedCity || !selectedDistrict) return
    supabase
      .from('locations')
      .select('id')
      .eq('region', selectedRegion)
      .eq('city', selectedCity)
      .eq('district', selectedDistrict)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setLocationId(data.id)
      })
  }, [selectedRegion, selectedCity, selectedDistrict])

  // Mark initial mount done after first render
  useEffect(() => {
    isInitialMount.current = false
  }, [])

  // Skills management
  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed])
    }
    setSkillInput('')
  }, [skillInput, skills])

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  // Language toggle
  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang])
  }

  // Experience history management
  const addExperience = () => {
    setExperienceHistory((prev) => [...prev, { company: '', title: '', from: '', to: '', description: '' }])
  }

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    setExperienceHistory((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const removeExperience = (index: number) => {
    setExperienceHistory((prev) => prev.filter((_, i) => i !== index))
  }

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `workers/${workerProfile?.user_id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      setPhotoUrl(publicUrl)
      await updateProfilePhoto(publicUrl)
    } catch {
      setError('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `workers/${workerProfile?.user_id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('videos').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)
      setVideoUrl(publicUrl)
      await updateProfileVideo(publicUrl)
    } catch {
      setError('Failed to upload video')
    } finally {
      setUploadingVideo(false)
    }
  }

  // Visibility toggle (saved with the rest of the form on submit)
  const handleVisibilityToggle = () => {
    setIsPublic((prev) => !prev)
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError(t('full_name') + ' required'); return }

    setSubmitting(true)
    try {
      const result = await saveWorkerProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        age: age === '' ? null : Number(age),
        gender: gender || null,
        locationId,
        profession: profession.trim(),
        categoryId,
        experienceYears: Number(experienceYears),
        skills,
        hskLevel: Number(hskLevel),
        languages,
        salaryMin: salaryMin === '' ? null : Number(salaryMin),
        salaryMax: salaryMax === '' ? null : Number(salaryMax),
        salaryCurrency,
        availabilityStatus,
        availableFrom: availabilityStatus === 'available_from' ? availableFrom : null,
        bioOriginal: bioOriginal.trim(),
        sourceLanguage,
        experienceHistory,
        isPublic,
      })

      if (result.success) {
        // Explicitly set isPublic from server response to survive any re-renders
        if (result.isPublic !== undefined) {
          setIsPublic(result.isPublic)
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    } catch {
      setError('Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  const completion = calculateCompletion(workerProfile, profile)
  const categoryName = (cat: JobCategory) => {
    const key = `name_${currentLocale}` as keyof JobCategory
    return (cat[key] as string) || cat.name_uz
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{t('profile_title')}</h1>
        {/* Completion bar */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{t('profile_completion')}</span>
            <span className="font-medium">{completion}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-red-600 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion < 80 && (
            <p className="mt-1 text-xs text-gray-500">{t('complete_profile_msg')}</p>
          )}
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <span className="text-sm">
          {isPublic ? t('profile_public') : t('profile_hidden')}
        </span>
        <button
          type="button"
          onClick={handleVisibilityToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isPublic ? 'bg-red-600' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Section 1: Photo & Video */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('photo')}</h2>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-400">
              {fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {uploadingPhoto ? '...' : t('upload_photo')}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('video_intro')}</h2>
          <p className="mb-2 text-sm text-gray-500">{t('video_optional')}</p>
          {videoUrl ? (
            <div className="space-y-2">
              <video src={videoUrl} controls className="w-full rounded-lg" />
              <button
                type="button"
                onClick={async () => { setVideoUrl(''); await updateProfileVideo(null) }}
                className="text-sm text-red-600 hover:underline"
              >
                {t('remove')}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {uploadingVideo ? '...' : t('video_intro')}
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </section>

      {/* Section 2: Personal Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('personal_info')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('full_name')} *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('age')}</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              min={16}
              max={70}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('gender')}</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">—</option>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="other">{t('prefer_not_to_say')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 3: Location */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('location')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('region')}</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">{t('region')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {cities.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">&nbsp;</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">—</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {districts.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">&nbsp;</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">—</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Professional Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('professional_info')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('profession')}</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('category')}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">—</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{categoryName(cat)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('experience_years')}</label>
          <input
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
            min={0}
            max={50}
            className="w-full max-w-[200px] rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('skills')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              placeholder={t('skills_placeholder')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              +
            </button>
          </div>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
                  {s}
                  <button type="button" onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Language Skills */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('language_skills')}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('chinese_level')}</label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setHskLevel(level)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${hskLevel === level ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {level === 0 ? t('no_chinese') : `HSK ${level}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t('other_languages')}</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${languages.includes(lang) ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {t(lang)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Salary Expectations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('salary_expectations')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Min</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Max</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['UZS', 'USD', 'CNY'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSalaryCurrency(c)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${salaryCurrency === c ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Section 7: Availability */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('availability')}</h2>
        <div className="flex flex-wrap gap-2">
          {(['available', 'available_from', 'not_available'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setAvailabilityStatus(status === 'not_available' ? 'unavailable' : status)}
              className={`rounded-lg border px-4 py-2 text-sm transition ${(availabilityStatus === status || (status === 'not_available' && availabilityStatus === 'unavailable')) ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {t(status)}
            </button>
          ))}
        </div>
        {availabilityStatus === 'available_from' && (
          <input
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        )}
      </section>

      {/* Section 8: Bio */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('about_me')}</h2>
        <textarea
          value={bioOriginal}
          onChange={(e) => setBioOriginal(e.target.value)}
          placeholder={t('bio_placeholder')}
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{t('char_count', { count: bioOriginal.length, max: 2000 })}</span>
          <div className="flex items-center gap-2">
            <span>{t('written_in')}:</span>
            {(['uz', 'zh', 'ru'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setSourceLanguage(l)}
                className={`rounded border px-2 py-0.5 text-xs ${sourceLanguage === l ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Work Experience */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('work_experience')}</h2>
        {experienceHistory.map((exp, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('company_name')}</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(i, 'company', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('job_title')}</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(i, 'title', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('from')}</label>
                <input
                  type="month"
                  value={exp.from}
                  onChange={(e) => updateExperience(i, 'from', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('to')}</label>
                <input
                  type="month"
                  value={exp.to}
                  onChange={(e) => updateExperience(i, 'to', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('description')}</label>
              <textarea
                value={exp.description}
                onChange={(e) => updateExperience(i, 'description', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeExperience(i)}
              className="text-sm text-red-600 hover:underline"
            >
              {t('remove')}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addExperience}
          className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          + {t('add_experience')}
        </button>
      </section>

      {/* Error & Success */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {saved && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{t('profile_saved')}</div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t('saving') : t('save_profile')}
      </button>
    </form>
  )
}
