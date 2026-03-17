import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PostJobForm } from './PostJobForm'

export const dynamic = 'force-dynamic'

export default async function EmployerPostJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { locale } = await params
  const { edit: editId } = await searchParams
  setRequestLocale(locale)

  const supabase = await createClient()

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

  // If editing, load the existing job
  let editJob = null
  if (editId) {
    const { data } = await supabase
      .from('jobs')
      .select('*, location:locations(*)')
      .eq('id', editId)
      .single()

    editJob = data
  }

  return (
    <PostJobForm
      categories={categories ?? []}
      regions={regions}
      editJob={editJob ?? undefined}
    />
  )
}
