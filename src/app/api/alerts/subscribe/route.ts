export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tagAlerts } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, postcode, radiusMiles, specialities } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const specialitiesStr = Array.isArray(specialities)
      ? specialities.join(', ')
      : typeof specialities === 'string'
      ? specialities
      : 'Any';

    const [alertRecord] = await db
      .insert(tagAlerts)
      .values({
        email: email.trim(),
        postcode: postcode ? postcode.trim() : null,
        radiusMiles: typeof radiusMiles === 'number' ? radiusMiles : 25,
        specialities: specialitiesStr,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "You're registered! We'll alert you as soon as a matching practitioner registers in your area.",
      alert: alertRecord,
    });
  } catch (error) {
    console.error('Failed to create tag alert:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to alerts.' },
      { status: 500 }
    );
  }
}
