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

  // Get company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return { success: false, error: 'Company not found' }

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

  const { error } = await supabase
    .from('companies')
    .update({
      name_original: input.nameOriginal,
      name_uz: input.nameUz || null,
      name_zh: input.nameZh || null,
      name_ru: input.nameRu || null,
      industry: input.industry || null,
      website: input.website || null,
      established_year: input.establishedYear,
      employee_count: input.employeeCount || null,
      ...descriptions,
    })
    .eq('id', company.id)

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
