import { createClient } from '@/lib/supabase/server'

/**
 * Generate a URL-safe English slug from one or more string parts.
 *
 * Input:  "Civil Engineer", "Huaxin Construction", "Tashkent"
 * Output: "civil-engineer-huaxin-construction-tashkent"
 */
export function slugify(...parts: string[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse consecutive hyphens
    .replace(/-{2,}/g, '-')
}

/**
 * Generate a unique slug by checking the database.
 * If the base slug already exists, appends -2, -3, etc.
 */
export async function uniqueSlug(
  base: string,
  table: string
): Promise<string> {
  const supabase = await createClient()
  const slug = slugify(base)

  // Check if slug exists
  const { data } = await supabase
    .from(table)
    .select('slug')
    .eq('slug', slug)
    .limit(1)
    .single()

  if (!data) return slug

  // Find next available suffix
  let counter = 2
  while (true) {
    const candidate = `${slug}-${counter}`
    const { data: existing } = await supabase
      .from(table)
      .select('slug')
      .eq('slug', candidate)
      .limit(1)
      .single()

    if (!existing) return candidate
    counter++
  }
}
