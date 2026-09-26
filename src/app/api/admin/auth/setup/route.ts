import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { verifyAdminSession } from '@/lib/adminAuth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPassword, newPin } = await request.json();

    if (!newPassword || !newPin) {
      return NextResponse.json({ error: 'Both new password and new PIN are required' }, { status: 400 });
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
    }

    const settings = await db.select().from(adminSettings).limit(1);
    
    if (settings.length === 0) {
      return NextResponse.json({ error: 'Admin settings not initialized' }, { status: 500 });
    }

    const hashPass = await bcrypt.hash(newPassword, 10);
    const hashPin = await bcrypt.hash(newPin, 10);

    await db.update(adminSettings)
      .set({ passwordHash: hashPass, twoFactorPinHash: hashPin })
      .where(eq(adminSettings.id, settings[0].id));

    return NextResponse.json({ success: true, message: 'Admin credentials updated successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
