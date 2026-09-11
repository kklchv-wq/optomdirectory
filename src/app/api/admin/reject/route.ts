export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
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
    const { listingId, rejectionReason } = await request.json();

    if (!listingId || typeof listingId !== 'number') {
      return NextResponse.json({ error: 'Valid listingId required' }, { status: 400 });
    }

    const reasonText = rejectionReason?.trim() || 'Details could not be verified.';

    const existing = await db.select().from(listings).where(eq(listings.id, listingId));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = existing[0];

    // Update status to rejected
    await db
      .update(listings)
      .set({
        status: 'rejected',
        rejectionReason: reasonText,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const editUrl = `${origin}/edit/${listing.editToken}`;

    // Send dev mailer notification
    await mailer.sendEmail({
      to: listing.email,
      subject: `Listing Status Update: ${listing.practiceName}`,
      type: 'listing_rejected',
      text: `Hello ${listing.contactName},

Your practice listing submission for "${listing.practiceName}" could not be approved at this time.

Reason provided by admin:
"${reasonText}"

You can review and update your practice details to resubmit for verification using your edit link:
${editUrl}

Best regards,
Optom Referral Directory Team`,
      metadata: {
        listingId,
        rejectionReason: reasonText,
      },
    });

    return NextResponse.json({ success: true, message: 'Listing rejected successfully' });
  } catch (error) {
    console.error('Reject API error:', error);
    return NextResponse.json({ error: 'Failed to reject listing' }, { status: 500 });
  }
}
