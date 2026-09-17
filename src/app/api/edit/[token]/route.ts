export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, listingSpecialities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { listingFormSchema } from '@/schemas/listing';
import { mailer } from '@/lib/mailer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const existingListings = await db
      .select()
      .from(listings)
      .where(eq(listings.editToken, token));

    if (existingListings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found for this edit token' },
        { status: 404 }
      );
    }

    const listing = existingListings[0];

    const currentSpecialities = await db
      .select({
        specialityId: listingSpecialities.specialityId,
        offeredBy: listingSpecialities.offeredBy,
        referralType: listingSpecialities.referralType,
      })
      .from(listingSpecialities)
      .where(eq(listingSpecialities.listingId, listing.id));

    const specialityIds = currentSpecialities.map((s) => s.specialityId);
    const specialityOfferedBy: Record<number, 'personal' | 'practice'> = {};
    const specialityReferralType: Record<number, 'referral_required' | 'self_referral'> = {};
    for (const s of currentSpecialities) {
      if (s.offeredBy) {
        specialityOfferedBy[s.specialityId] = s.offeredBy as 'personal' | 'practice';
      }
      if (s.referralType) {
        specialityReferralType[s.specialityId] = s.referralType as 'referral_required' | 'self_referral';
      }
    }

    return NextResponse.json({
      listing,
      specialityIds,
      specialityOfferedBy,
      specialityReferralType,
    });
  } catch (error) {
    console.error('Edit GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve listing for edit' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const existingListings = await db
      .select()
      .from(listings)
      .where(eq(listings.editToken, token));

    if (existingListings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found for this edit token' },
        { status: 404 }
      );
    }

    const existingListing = existingListings[0];
    const body = await request.json();
    const parseResult = listingFormSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check if core practice details changed (requires admin re-approval)
    // Contact details (phone, email, website), description, working days, and offered services update live immediately.
    const practiceDetailsChanged =
      existingListing.practiceName !== data.practiceName ||
      existingListing.contactName !== data.contactName ||
      existingListing.gocNumber !== data.gocNumber ||
      existingListing.addressLine1 !== data.addressLine1 ||
      (existingListing.addressLine2 || '') !== (data.addressLine2 || '') ||
      existingListing.city !== data.city ||
      existingListing.postcode !== data.postcode;

    // Listings remain approved and published live immediately upon edit.
    const newStatus = existingListing.status === 'rejected' ? 'rejected' : 'approved';

    // Execute updates inside an atomic database transaction
    await db.transaction(async (tx) => {
      await tx
        .update(listings)
        .set({
          practiceName: data.practiceName,
          contactName: data.contactName,
          gocNumber: data.gocNumber,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          postcode: data.postcode,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          email: data.email,
          website: data.website || null,
          description: data.description || null,
          workingDays: data.workingDays && data.workingDays.length > 0 ? JSON.stringify(data.workingDays) : null,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, existingListing.id));

      // Clear old specialities and re-insert updated specialities atomically
      await tx
        .delete(listingSpecialities)
        .where(eq(listingSpecialities.listingId, existingListing.id));

      if (data.specialityIds.length > 0) {
        await tx.insert(listingSpecialities).values(
          data.specialityIds.map((specId) => {
            const specKey = specId.toString();
            const rawOfferedBy =
              data.specialityOfferedBy?.[specKey] ||
              (data.specialityOfferedBy as Record<number, string>)?.[specId];
            const rawReferralType =
              data.specialityReferralType?.[specKey] ||
              (data.specialityReferralType as Record<number, string>)?.[specId];

            const offeredBy: 'personal' | 'practice' | null =
              rawOfferedBy === 'personal' || rawOfferedBy === 'practice'
                ? rawOfferedBy
                : null;
            const referralType: 'referral_required' | 'self_referral' | null =
              rawReferralType === 'referral_required' || rawReferralType === 'self_referral'
                ? rawReferralType
                : null;

            return {
              listingId: existingListing.id,
              specialityId: specId,
              offeredBy,
              referralType,
            };
          })
        );
      }
    });

    return NextResponse.json({
      success: true,
      reapprovalRequired: false,
      message: 'Practice profile updated live on the directory!',
      listingId: existingListing.id,
    });
  } catch (error) {
    console.error('Edit PUT API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update listing' },
      { status: 500 }
    );
  }
}
