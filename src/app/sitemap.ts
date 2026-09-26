import { MetadataRoute } from 'next';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.optomdirectory.co.uk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base routes
  const routes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Fetch approved practices
  try {
    const approvedListings = await db
      .select({
        slug: listings.slug,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(eq(listings.status, 'approved'));

    const dynamicRoutes = approvedListings.map((listing) => ({
      url: `${SITE_URL}/optometrist/${listing.slug}`,
      // Fallback to current date if updatedAt is missing
      lastModified: listing.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    return [...routes, ...dynamicRoutes];
  } catch (error) {
    console.error('Failed to fetch listings for sitemap:', error);
    return routes;
  }
}
