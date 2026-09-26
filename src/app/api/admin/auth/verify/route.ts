import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { createAdminSession } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const settings = await db.select().from(adminSettings).limit(1);
    
    if (settings.length === 0) {
      return NextResponse.json({ error: 'Admin settings not initialized' }, { status: 500 });
    }

    const isValid = await bcrypt.compare(pin, settings[0].twoFactorPinHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // PIN is correct, create session
    await createAdminSession();

    return NextResponse.json({ success: true, message: 'Authentication successful' });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
