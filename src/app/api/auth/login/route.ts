export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format.' },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = existingUsers[0];
    const isValidPassword = verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session cookie
    await createSession(user.id, rememberMe);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gocNumber: user.gocNumber,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in.' },
      { status: 500 }
    );
  }
}
