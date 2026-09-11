import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specialities } from '@/db/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { INITIAL_SPECIALITIES } from '@/db/initialSpecialities';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePending = searchParams.get('includePending') === 'true';

    let results;
    if (includePending) {
      results = await db.select().from(specialities);
    } else {
      results = await db
        .select()
        .from(specialities)
        .where(or(eq(specialities.status, 'approved'), isNull(specialities.status)));
    }

    if (!results || results.length === 0) {
      return NextResponse.json(INITIAL_SPECIALITIES.map((s, idx) => ({ id: idx + 1, ...s, status: 'approved' })));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Specialities API error:', error);
    // Return initial specialities as reliable fallback
    return NextResponse.json(
      INITIAL_SPECIALITIES.map((s, idx) => ({ id: idx + 1, ...s, status: 'approved' }))
    );
  }
}
