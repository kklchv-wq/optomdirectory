export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, listingSpecialities, tagAlerts } from '@/db/schema';
import { listingFormSchema } from '@/schemas/listing';
import { generateSlug } from '@/lib/slug';
import { mailer } from '@/lib/mailer';
import { lookupUkPostcode } from '@/lib/geocoding';
import crypto from 'crypto';

import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
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
    const editToken = crypto.randomUUID();
    const slug = generateSlug(data.practiceName, data.city);

    let finalLat = data.latitude;
    let finalLng = data.longitude;

    // Auto-lookup exact UK unit postcode coordinates if default lat/lng passed
    if (data.postcode) {
      const pcResult = await lookupUkPostcode(data.postcode);
      if (pcResult && pcResult.latitude && pcResult.longitude) {
        // If user left coordinates as generic default city center, override with precise unit postcode coordinates
        if (
          Math.abs(finalLat - 57.1497) < 0.001 &&
          Math.abs(finalLng - (-2.0943)) < 0.001
        ) {
          finalLat = pcResult.latitude;
          finalLng = pcResult.longitude;
        }
      }
    }

    // Insert listing row
    const [insertedListing] = await db
      .insert(listings)
      .values({
        userId: authUser ? authUser.id : null,
        slug,
        practiceName: data.practiceName,
        contactName: data.contactName,
        gocNumber: data.gocNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        postcode: data.postcode,
        latitude: finalLat,
        longitude: finalLng,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        description: data.description || null,
        workingDays: data.workingDays && data.workingDays.length > 0 ? JSON.stringify(data.workingDays) : null,
        subscribeUpdates: data.subscribeUpdates ?? true,
        status: 'pending',
        editToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // If practitioner opted in to updates, save email subscription into tag_alerts table
    if (data.subscribeUpdates !== false && data.email) {
      try {
        await db.insert(tagAlerts).values({
          email: data.email.toLowerCase(),
          postcode: data.postcode,
          radiusMiles: 25,
          specialities: 'All updates & newsletter',
          createdAt: new Date(),
        });
      } catch {
        // Ignore duplicate alert subscription errors
      }
    }

    // Insert specialities join entries
    if (data.specialityIds.length > 0) {
      await db.insert(listingSpecialities).values(
        data.specialityIds.map((specId) => {
          const specKey = specId.toString();
          const offeredBy =
            data.specialityOfferedBy?.[specKey] ||
            (data.specialityOfferedBy as Record<number, string>)?.[specId] ||
            null;
          const referralType =
            data.specialityReferralType?.[specKey] ||
            (data.specialityReferralType as Record<number, string>)?.[specId] ||
            null;

          return {
            listingId: insertedListing.id,
            specialityId: specId,
            offeredBy: offeredBy ? (offeredBy as 'personal' | 'practice') : null,
            referralType: referralType ? (referralType as 'referral_required' | 'self_referral') : null,
          };
        })
      );
    }

    // Construct local edit URL
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const editUrl = `${origin}/edit/${editToken}`;

    // Trigger local dev mailer
    await mailer.sendEmail({
      to: data.email,
      subject: `Listing Submission Received: ${data.practiceName}`,
      type: 'submission_received',
      text: `Hello ${data.contactName},

Thank you for submitting your practice listing for "${data.practiceName}" to the Optometrist Speciality Directory.

Your listing has been queued for admin verification. Once reviewed, your listing will be published.

You can return to edit or update your practice listing at any time using your secret edit link:
${editUrl}

(Please keep this edit link safe as it grants access to modify your listing details).

Best regards,
Optom Referral Directory Team`,
      metadata: {
        listingId: insertedListing.id,
        editToken,
        editUrl,
      },
    });

    return NextResponse.json({
      success: true,
      listingId: insertedListing.id,
      editToken,
      editUrl,
      slug: insertedListing.slug,
    });
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json(
      { error: 'Failed to process listing submission' },
      { status: 500 }
    );
  }
}
