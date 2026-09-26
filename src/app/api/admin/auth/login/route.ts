import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const settings = await db.select().from(adminSettings).limit(1);
    
    if (settings.length === 0) {
      return NextResponse.json({ error: 'Admin settings not initialized' }, { status: 500 });
    }

    const isValid = await bcrypt.compare(password, settings[0].passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Password is correct, return success to prompt for PIN
    return NextResponse.json({ success: true, message: 'Password verified. Please enter PIN.' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
