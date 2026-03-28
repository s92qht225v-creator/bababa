import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.baibang.uz'
const locales = ['uz', 'zh', 'ru'] as const

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified?: string
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    lastModified: lastModified || new Date().toISOString(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${siteUrl}/${l}${path.replace(/^\/[a-z]{2}/, '')}`])
      ),
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ['', '/jobs', '/workers', '/companies', '/about', '/how-it-works']
  const entries: MetadataRoute.Sitemap = []

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push(
        entry(
          `/${locale}${page}`,
          page === '' ? 'daily' : 'weekly',
          page === '' ? 1.0 : 0.8
        )
      )
    }
  }

  // Dynamic pages from DB
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [{ data: jobs }, { data: companies }, { data: categories }] = await Promise.all([
      supabase.from('jobs').select('slug, updated_at').eq('status', 'active'),
      supabase.from('companies').select('slug, updated_at'),
      supabase.from('job_categories').select('slug'),
    ])

    if (jobs) {
      for (const job of jobs) {
        for (const locale of locales) {
          entries.push(
            entry(`/${locale}/jobs/${job.slug}`, 'weekly', 0.7, job.updated_at)
          )
        }
      }
    }

    if (companies) {
      for (const company of companies) {
        for (const locale of locales) {
          entries.push(
            entry(`/${locale}/companies/${company.slug}`, 'weekly', 0.6, company.updated_at)
          )
        }
      }
    }

    if (categories) {
      for (const cat of categories) {
        for (const locale of locales) {
          entries.push(entry(`/${locale}/jobs/category/${cat.slug}`, 'weekly', 0.6))
        }
      }
    }
  } catch (e) {
    console.warn('Sitemap: Could not fetch dynamic paths:', e)
  }

  return entries
}
