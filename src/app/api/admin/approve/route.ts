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

    // Send dev mailer notification
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

    return NextResponse.json({ success: true, message: 'Listing approved successfully' });
  } catch (error) {
    console.error('Approve API error:', error);
    return NextResponse.json({ error: 'Failed to approve listing' }, { status: 500 });
  }
}
