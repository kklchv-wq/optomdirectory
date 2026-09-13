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
      specialityOfferedBy[s.specialityId] = (s.offeredBy || 'practice') as 'personal' | 'practice';
      specialityReferralType[s.specialityId] = (s.referralType || 'self_referral') as 'referral_required' | 'self_referral';
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

    // Check if core practice details changed
    const coreDetailsChanged =
      existingListing.practiceName !== data.practiceName ||
      existingListing.contactName !== data.contactName ||
      existingListing.gocNumber !== data.gocNumber ||
      existingListing.addressLine1 !== data.addressLine1 ||
      (existingListing.addressLine2 || '') !== (data.addressLine2 || '') ||
      existingListing.city !== data.city ||
      existingListing.postcode !== data.postcode ||
      existingListing.phone !== data.phone ||
      existingListing.email !== data.email ||
      (existingListing.website || '') !== (data.website || '') ||
      (existingListing.description || '') !== (data.description || '');

    // Only require re-approval if core practice details changed.
    // Services & equipment changes apply immediately without admin re-approval.
    const newStatus = coreDetailsChanged
      ? 'pending'
      : (existingListing.status === 'approved' ? 'approved' : existingListing.status);

    await db
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

    // Clear old specialities and re-insert updated specialities
    await db
      .delete(listingSpecialities)
      .where(eq(listingSpecialities.listingId, existingListing.id));

    if (data.specialityIds.length > 0) {
      await db.insert(listingSpecialities).values(
        data.specialityIds.map((specId) => {
          const specKey = specId.toString();
          const offeredBy =
            data.specialityOfferedBy?.[specKey] ||
            (data.specialityOfferedBy as Record<number, string>)?.[specId] ||
            'personal';
          const referralType =
            data.specialityReferralType?.[specKey] ||
            (data.specialityReferralType as Record<number, string>)?.[specId] ||
            'self_referral';

          return {
            listingId: existingListing.id,
            specialityId: specId,
            offeredBy: offeredBy as 'personal' | 'practice',
            referralType: referralType as 'referral_required' | 'self_referral',
          };
        })
      );
    }

    if (coreDetailsChanged) {
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      const editUrl = `${origin}/edit/${token}`;

      await mailer.sendEmail({
        to: data.email,
        subject: `Listing Details Submitted for Re-Approval: ${data.practiceName}`,
        type: 'submission_received',
        text: `Hello ${data.contactName},

Your updates to your practice details for "${data.practiceName}" have been received.

Because practice contact or GOC details were modified, your listing has been queued for admin verification before going live.

Edit link: ${editUrl}

Best regards,
Optom Referral Directory Team`,
        metadata: {
          listingId: existingListing.id,
          editToken: token,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reapprovalRequired: coreDetailsChanged,
      message: coreDetailsChanged
        ? 'Practice details updated and queued for admin re-approval.'
        : 'Services & Equipment updated instantly live on your listing!',
      listingId: existingListing.id,
    });
  } catch (error) {
    console.error('Edit PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}
