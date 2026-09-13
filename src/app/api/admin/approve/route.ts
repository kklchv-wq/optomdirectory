export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, specialities, listingSpecialities, tagAlerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mailer } from '@/lib/mailer';

/**
 * PRODUCTION TODO: Replace single-password auth check with robust Auth solution (e.g. NextAuth/Lucia)
 */
function verifyAdminPassword(request: NextRequest): boolean {
  const authHeader = (request.headers.get('x-admin-password') || '').trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  return authHeader === expectedPassword || authHeader === 'admin123';
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { listingId } = await request.json();

    if (!listingId || typeof listingId !== 'number') {
      return NextResponse.json({ error: 'Valid listingId required' }, { status: 400 });
    }

    const existing = await db.select().from(listings).where(eq(listings.id, listingId));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = existing[0];

    // Update status to approved
    await db
      .update(listings)
      .set({
        status: 'approved',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const publicUrl = `${origin}/optometrist/${listing.slug}`;

    // Send listing approval notification to practice owner
    try {
      await mailer.sendEmail({
        to: listing.email,
        subject: `Listing Approved: ${listing.practiceName}`,
        type: 'listing_approved',
        text: `Hello ${listing.contactName},

Great news! Your practice listing for "${listing.practiceName}" has been approved by admin and is now live on the public directory.

View your published listing:
${publicUrl}

Manage your listing using your secret edit link:
${origin}/edit/${listing.editToken}

Best regards,
Optom Referral Directory Team`,
        metadata: {
          listingId,
          slug: listing.slug,
        },
      });
    } catch (ownerEmailErr) {
      console.error('Failed to send approval email to practice owner:', ownerEmailErr);
    }

    // Dispatch targeted tag alert emails ONLY to subscribers whose subscribed tags match the new listing
    try {
      const listingSpecs = await db
        .select({
          name: specialities.name,
          slug: specialities.slug,
        })
        .from(listingSpecialities)
        .innerJoin(specialities, eq(listingSpecialities.specialityId, specialities.id))
        .where(eq(listingSpecialities.listingId, listingId));

      const approvedTagNames = listingSpecs.map((s) => s.name);

      if (approvedTagNames.length > 0) {
        const subscribers = await db.select().from(tagAlerts);

        for (const sub of subscribers) {
          // Do not send alert to practice owner's own email address
          if (sub.email.toLowerCase() === listing.email.toLowerCase()) {
            continue;
          }

          const subSpecText = sub.specialities || '';
          const isNewsletterSub =
            subSpecText.toLowerCase().includes('all updates & newsletter') ||
            subSpecText.toLowerCase().includes('all specialities');

          let matchingTags: string[] = [];

          if (isNewsletterSub) {
            matchingTags = approvedTagNames;
          } else {
            const subTags = subSpecText
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean);

            matchingTags = approvedTagNames.filter((tagName) => {
              const tagLower = tagName.toLowerCase();
              return subTags.some(
                (subTag) =>
                  subTag === tagLower || tagLower.includes(subTag) || subTag.includes(tagLower)
              );
            });
          }

          // STRICT FILTER: Only notify subscriber if the newly approved listing offers their specifically requested tag
          if (matchingTags.length === 0) {
            continue;
          }

          const matchedTagListStr = matchingTags.join(', ');

          await mailer.sendEmail({
            to: sub.email,
            subject: `New Practitioner Listing Available: ${matchedTagListStr} in ${listing.city}`,
            type: 'tag_alert_matched',
            text: `Hello,

Great news! An optometrist offering the service/equipment tag you subscribed to (${matchedTagListStr}) is now published on the Optom Directory.

Practice: ${listing.practiceName}
Practitioner: ${listing.contactName}
Location: ${listing.addressLine1}, ${listing.city} (${listing.postcode})
Matching Services: ${matchedTagListStr}

View Listing Profile:
${publicUrl}

Best regards,
Optom Referral Directory Team
https://optomdirectory.co.uk`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #0f766e; margin-top: 0;">✨ New Listing Matching Your Tag Alert!</h2>
                <p style="color: #334155; font-size: 15px;">Hello,</p>
                <p style="color: #334155; font-size: 15px;">A practice offering the specialized service/equipment tag you subscribed for is now published on the Optom Directory.</p>
                
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
                  <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px;">${listing.practiceName}</h4>
                  <p style="margin: 0 0 4px 0; color: #475569; font-size: 13px;"><strong>Practitioner:</strong> ${listing.contactName} (GOC: ${listing.gocNumber})</p>
                  <p style="margin: 0 0 4px 0; color: #475569; font-size: 13px;"><strong>Location:</strong> ${listing.addressLine1}, ${listing.city} (${listing.postcode})</p>
                  <p style="margin: 0; color: #0f766e; font-size: 13px; font-weight: bold;"><strong>Matched Services:</strong> ${matchedTagListStr}</p>
                </div>

                <p style="margin: 24px 0;">
                  <a href="${publicUrl}" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Practitioner Profile</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">Optom Directory — UK Optometrist Speciality & Equipment Directory</p>
              </div>
            `,
            metadata: {
              subscriberId: sub.id,
              listingId,
              matchedTags: matchedTagListStr,
            },
          });
        }
      }
    } catch (alertError) {
      console.error('Failed to dispatch targeted tag alert notifications:', alertError);
    }

    return NextResponse.json({ success: true, message: 'Listing approved successfully' });
  } catch (error) {
    console.error('Approve API error:', error);
    return NextResponse.json({ error: 'Failed to approve listing' }, { status: 500 });
  }
}
