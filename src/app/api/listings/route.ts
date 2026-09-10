import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, specialities, listingSpecialities } from '@/db/schema';
import { eq, and, gte, lte, like, or } from 'drizzle-orm';
import { calculateHaversineDistance, getBoundingBox } from '@/lib/haversine';

// Aberdeen City Centre Fallback Coordinates
const ABERDEEN_CITY_CENTRE = {
  lat: 57.1497,
  lng: -2.0943,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');
    const specialitiesParam = searchParams.get('specialities');
    const searchParam = searchParams.get('search');

    const centerLat = latParam ? parseFloat(latParam) : ABERDEEN_CITY_CENTRE.lat;
    const centerLng = lngParam ? parseFloat(lngParam) : ABERDEEN_CITY_CENTRE.lng;
    const radiusMiles = radiusParam ? parseFloat(radiusParam) : 50;

    const selectedSpecialitySlugs = specialitiesParam
      ? specialitiesParam.split(',').filter(Boolean)
      : [];

    const isNationwide = radiusMiles >= 500;

    // Build SQL condition array
    const conditions = [eq(listings.status, 'approved')];

    if (!isNationwide) {
      const bbox = getBoundingBox(centerLat, centerLng, radiusMiles);
      conditions.push(
        gte(listings.latitude, bbox.minLat),
        lte(listings.latitude, bbox.maxLat),
        gte(listings.longitude, bbox.minLng),
        lte(listings.longitude, bbox.maxLng)
      );
    }

    if (searchParam && searchParam.trim()) {
      const query = `%${searchParam.trim()}%`;
      conditions.push(
        or(
          like(listings.practiceName, query),
          like(listings.city, query),
          like(listings.postcode, query),
          like(listings.description, query)
        )!
      );
    }

    // Fetch candidate listings from database
    const candidateListings = await db
      .select()
      .from(listings)
      .where(and(...conditions));

    if (candidateListings.length === 0) {
      return NextResponse.json({
        listings: [],
        center: { lat: centerLat, lng: centerLng },
        radiusMiles,
      });
    }

    // Fetch all listing-speciality relations and speciality master list
    const candidateIds = candidateListings.map((l) => l.id);

    const relations = await db
      .select({
        listingId: listingSpecialities.listingId,
        offeredBy: listingSpecialities.offeredBy,
        referralType: listingSpecialities.referralType,
        speciality: specialities,
      })
      .from(listingSpecialities)
      .innerJoin(specialities, eq(listingSpecialities.specialityId, specialities.id));

    // Map specialities to listings
    const listingSpecialitiesMap = new Map<number, (typeof specialities.$inferSelect & { offeredBy: 'personal' | 'practice'; referralType: 'referral_required' | 'self_referral' })[]>();
    for (const rel of relations) {
      if (!listingSpecialitiesMap.has(rel.listingId)) {
        listingSpecialitiesMap.set(rel.listingId, []);
      }
      listingSpecialitiesMap.get(rel.listingId)!.push({
        ...rel.speciality,
        offeredBy: (rel.offeredBy || 'practice') as 'personal' | 'practice',
        referralType: (rel.referralType || 'self_referral') as 'referral_required' | 'self_referral',
      });
    }

    // Calculate exact Haversine distance and filter/sort
    const results = candidateListings
      .map((listing) => {
        const distanceMiles = calculateHaversineDistance(
          centerLat,
          centerLng,
          listing.latitude,
          listing.longitude
        );

        const practiceSpecialities = listingSpecialitiesMap.get(listing.id) || [];

        return {
          ...listing,
          specialities: practiceSpecialities,
          distanceMiles: Math.round(distanceMiles * 10) / 10, // Round to 1 decimal place
        };
      })
      .filter((item) => {
        // Filter by radius (unless nationwide)
        if (!isNationwide && item.distanceMiles > radiusMiles) return false;

        // Filter by selected specialities if specified (must match ALL or ANY selected)
        if (selectedSpecialitySlugs.length > 0) {
          const itemSpecialitySlugs = item.specialities.map((s) => s.slug);
          const hasMatchingSpeciality = selectedSpecialitySlugs.some((slug) =>
            itemSpecialitySlugs.includes(slug)
          );
          if (!hasMatchingSpeciality) return false;
        }

        return true;
      })
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return NextResponse.json({
      listings: results,
      center: { lat: centerLat, lng: centerLng },
      radiusMiles,
    });
  } catch (error) {
    console.error('Listings spatial API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve listings' },
      { status: 500 }
    );
  }
}
