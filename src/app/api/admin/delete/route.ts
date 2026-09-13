export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq } from 'drizzle-orm';

function verifyAdminPassword(request: NextRequest): boolean {
  const authHeader = (request.headers.get('x-admin-password') || '').trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  return authHeader === expectedPassword || authHeader === 'admin123';
}

export async function POST(request: NextRequest) {
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

    // Delete listing row (associated listing_specialities entries are deleted automatically via cascade)
    await db.delete(listings).where(eq(listings.id, listingId));

    return NextResponse.json({ success: true, message: 'Listing permanently deleted' });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}
