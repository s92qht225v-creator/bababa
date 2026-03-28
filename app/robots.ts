import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/uz/employer/',
        '/zh/employer/',
        '/ru/employer/',
        '/uz/worker/',
        '/zh/worker/',
        '/ru/worker/',
        '/api/',
        '/uz/auth/',
        '/zh/auth/',
        '/ru/auth/',
      ],
    },
    sitemap: 'https://www.baibang.uz/sitemap.xml',
  }
}
