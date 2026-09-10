import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specialities } from '@/db/schema';
import { eq, or, isNull } from 'drizzle-orm';

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

    return NextResponse.json(results);
  } catch (error) {
    console.error('Specialities API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve specialities' },
      { status: 500 }
    );
  }
}
