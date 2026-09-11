export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/db';
import { listings, listingSpecialities, specialities } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ user: null, listing: null });
  }

  // Fetch practitioner's listing
  const userListings = await db
    .select()
    .from(listings)
    .where(eq(listings.userId, user.id));

  let listing = null;

  if (userListings.length > 0) {
    const rawListing = userListings[0];

    const currentSpecialities = await db
      .select({
        specialityId: listingSpecialities.specialityId,
        offeredBy: listingSpecialities.offeredBy,
        referralType: listingSpecialities.referralType,
        speciality: specialities,
      })
      .from(listingSpecialities)
      .innerJoin(specialities, eq(listingSpecialities.specialityId, specialities.id))
      .where(eq(listingSpecialities.listingId, rawListing.id));

    listing = {
      ...rawListing,
      specialities: currentSpecialities.map((s) => ({
        ...s.speciality,
        offeredBy: s.offeredBy,
        referralType: s.referralType,
      })),
    };
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      gocNumber: user.gocNumber,
    },
    listing,
  });
}
