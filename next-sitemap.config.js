/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://baibang.uz',
  generateRobotsTxt: false,
  generateIndexSitemap: true,
  exclude: [
    '/admin/*',
    '/employer/*',
    '/worker/*',
    '/api/*',
    '/auth/*',
    '/*/employer/*',
    '/*/worker/*',
    '/*/auth/*',
  ],
  additionalPaths: async (config) => {
    const locales = ['uz', 'zh', 'ru']
    const staticPages = ['', '/jobs', '/workers', '/companies', '/about', '/how-it-works']
    const paths = []

    for (const locale of locales) {
      for (const page of staticPages) {
        paths.push({
          loc: `/${locale}${page}`,
          changefreq: page === '' ? 'daily' : 'weekly',
          priority: page === '' ? 1.0 : 0.8,
          lastmod: new Date().toISOString(),
          alternateRefs: locales.map((l) => ({
            href: `https://baibang.uz/${l}${page}`,
            hreflang: l,
          })),
        })
      }
    }

    // Dynamic job pages
    try {
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: jobs } = await supabase
        .from('jobs')
        .select('slug, updated_at')
        .eq('status', 'active')

      if (jobs) {
        for (const job of jobs) {
          for (const locale of locales) {
            paths.push({
              loc: `/${locale}/jobs/${job.slug}`,
              changefreq: 'weekly',
              priority: 0.7,
              lastmod: job.updated_at || new Date().toISOString(),
              alternateRefs: locales.map((l) => ({
                href: `https://baibang.uz/${l}/jobs/${job.slug}`,
                hreflang: l,
              })),
            })
          }
        }
      }

      const { data: companies } = await supabase
        .from('companies')
        .select('slug, updated_at')

      if (companies) {
        for (const company of companies) {
          for (const locale of locales) {
            paths.push({
              loc: `/${locale}/companies/${company.slug}`,
              changefreq: 'weekly',
              priority: 0.6,
              lastmod: company.updated_at || new Date().toISOString(),
              alternateRefs: locales.map((l) => ({
                href: `https://baibang.uz/${l}/companies/${company.slug}`,
                hreflang: l,
              })),
            })
          }
        }
      }

      const { data: categories } = await supabase
        .from('job_categories')
        .select('slug')

      if (categories) {
        for (const cat of categories) {
          for (const locale of locales) {
            paths.push({
              loc: `/${locale}/jobs/category/${cat.slug}`,
              changefreq: 'weekly',
              priority: 0.6,
              alternateRefs: locales.map((l) => ({
                href: `https://baibang.uz/${l}/jobs/category/${cat.slug}`,
                hreflang: l,
              })),
            })
          }
        }
      }
    } catch (e) {
      console.warn('Sitemap: Could not fetch dynamic paths:', e.message)
    }

    return paths
  },
}
