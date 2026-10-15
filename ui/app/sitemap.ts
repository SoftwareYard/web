import type { MetadataRoute } from 'next'
import { getJobSlugs } from '@/lib/jobs'
import { getClientSlugs } from '@/lib/clients'

const SITE_URL = 'https://softwareyard.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobSlugs = await getJobSlugs()
  const clientSlugs = await getClientSlugs()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/clients`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const jobRoutes: MetadataRoute.Sitemap = jobSlugs.map((slug) => ({
    url: `${SITE_URL}/careers/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const clientRoutes: MetadataRoute.Sitemap = clientSlugs.map((slug) => ({
    url: `${SITE_URL}/clients/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...jobRoutes, ...clientRoutes]
}
