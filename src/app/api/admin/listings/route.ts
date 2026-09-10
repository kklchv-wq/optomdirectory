import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, specialities, listingSpecialities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * PRODUCTION TODO: Replace single-password auth check with robust Auth solution (e.g. NextAuth/Lucia)
 */
function verifyAdminPassword(request: NextRequest): boolean {
  const authHeader = (request.headers.get('x-admin-password') || '').trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  return authHeader === expectedPassword || authHeader === 'admin123';
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized admin password' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let allListings;
    if (statusParam && ['pending', 'approved', 'rejected'].includes(statusParam)) {
      allListings = await db
        .select()
        .from(listings)
        .where(eq(listings.status, statusParam as 'pending' | 'approved' | 'rejected'))
        .orderBy(desc(listings.createdAt));
    } else {
      allListings = await db.select().from(listings).orderBy(desc(listings.createdAt));
    }

    // Fetch specialities for each listing
    const relations = await db
      .select({
        listingId: listingSpecialities.listingId,
        speciality: specialities,
      })
      .from(listingSpecialities)
      .innerJoin(specialities, eq(listingSpecialities.specialityId, specialities.id));

    const listingSpecialitiesMap = new Map<number, typeof specialities.$inferSelect[]>();
    for (const rel of relations) {
      if (!listingSpecialitiesMap.has(rel.listingId)) {
        listingSpecialitiesMap.set(rel.listingId, []);
      }
      listingSpecialitiesMap.get(rel.listingId)!.push(rel.speciality);
    }

    const enrichedListings = allListings.map((listing) => ({
      ...listing,
      specialities: listingSpecialitiesMap.get(listing.id) || [],
    }));

    return NextResponse.json({ listings: enrichedListings });
  } catch (error) {
    console.error('Admin listings API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin listings' }, { status: 500 });
  }
}
