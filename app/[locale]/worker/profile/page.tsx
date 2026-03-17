import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Load worker profile
  const { data: workerProfile } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Load profile (name, phone)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, language_preference')
    .eq('id', user!.id)
    .single()

  // Load categories
  const { data: categories } = await supabase
    .from('job_categories')
    .select('*')
    .order('name_uz')

  // Load unique regions
  const { data: locationData } = await supabase
    .from('locations')
    .select('region')
    .order('region')

  const regions = [...new Set((locationData ?? []).map((l) => l.region))]

  // Load current location if set
  let currentLocation = null
  if (workerProfile?.location_id) {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', workerProfile.location_id)
      .single()
    currentLocation = data
  }

  return (
    <ProfileForm
      locale={locale}
      profile={profile}
      workerProfile={workerProfile}
      categories={categories ?? []}
      regions={regions}
      currentLocation={currentLocation}
    />
  )
}
