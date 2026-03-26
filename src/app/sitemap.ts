import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gkretrokits.com';
  
  // Get all kits for share URLs
  const kits = await db.kit.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Dynamic kit pages
  const kitPages: MetadataRoute.Sitemap = kits.map((kit) => ({
    url: `${baseUrl}/share/${kit.id}`,
    lastModified: kit.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...kitPages];
}
