import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, listings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession } from '@/lib/auth';
import { z } from 'zod';
import { gocNumberRegex } from '@/schemas/listing';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Must be a valid email address'),
  gocNumber: z.string().trim().regex(gocNumberRegex, 'Must be a valid UK GOC number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = signupSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, gocNumber, password } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name,
        gocNumber,
        createdAt: new Date(),
      })
      .returning();

    // Auto-link any existing practice listing with matching email
    await db
      .update(listings)
      .set({ userId: newUser.id })
      .where(eq(listings.email, normalizedEmail));

    // Create session cookie
    await createSession(newUser.id);

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        gocNumber: newUser.gocNumber,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create practitioner account.' },
      { status: 500 }
    );
  }
}
