'use server'

import { createClient } from '@/lib/supabase/server'
import { translateCompanyDescription } from '@/lib/translate'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export interface SaveCompanyInput {
  nameOriginal: string
  nameUz: string
  nameZh: string
  nameRu: string
  industry: string
  descriptionOriginal: string
  sourceLanguage: string
  website: string
  establishedYear: number | null
  employeeCount: string
}

export async function saveCompanyProfile(input: SaveCompanyInput): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get existing company for this user
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const existingCompany = companies?.[0]

  // Translate description if provided
  let descriptions = {}
  if (input.descriptionOriginal) {
    try {
      const translated = await translateCompanyDescription(
        input.descriptionOriginal,
        input.sourceLanguage
      )
      descriptions = translated
    } catch {
      descriptions = {
        description_zh: input.descriptionOriginal,
        description_uz: input.descriptionOriginal,
        description_ru: input.descriptionOriginal,
      }
    }
  }

  // Generate slug from name
  const slug = input.nameOriginal
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

  const companyData = {
    name_original: input.nameOriginal,
    name_uz: input.nameUz || null,
    name_zh: input.nameZh || null,
    name_ru: input.nameRu || null,
    industry: input.industry || null,
    website: input.website || null,
    established_year: input.establishedYear,
    employee_count: input.employeeCount || null,
    ...descriptions,
  }

  let error
  if (existingCompany) {
    ;({ error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', existingCompany.id))
  } else {
    ;({ error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        user_id: user.id,
        slug: slug || `company-${Date.now()}`,
      }))
  }

  if (error) return { success: false, error: error.message }

  revalidatePath('/[locale]/companies', 'page')
  revalidatePath(`/[locale]/employer/company`, 'page')
  return { success: true }
}

export async function uploadCompanyLogo(formData: FormData): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return { success: false, error: 'Company not found' }

  const file = formData.get('logo') as File
  if (!file) return { success: false, error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `${company.id}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from('company-logos')
    .getPublicUrl(path)

  const logoUrl = urlData.publicUrl

  await supabase
    .from('companies')
    .update({ logo_url: logoUrl })
    .eq('id', company.id)

  revalidatePath('/[locale]/companies', 'page')
  return { success: true, url: logoUrl }
}
