import type { MetadataRoute } from 'next'

const SITE_URL = 'https://softwareyard.co'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/ctrl',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
