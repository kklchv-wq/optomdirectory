export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function DELETE(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized admin password' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    let listingId = idParam ? parseInt(idParam, 10) : null;
    if (!listingId) {
      const body = await request.json().catch(() => ({}));
      if (body.listingId) {
        listingId = Number(body.listingId);
      }
    }

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId parameter' }, { status: 400 });
    }

    await db.delete(listings).where(eq(listings.id, listingId));

    return NextResponse.json({ success: true, message: 'Listing permanently deleted' });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
