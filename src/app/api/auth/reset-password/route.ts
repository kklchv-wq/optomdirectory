export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResetTokens, sessions } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { token, newPassword } = parseResult.data;

    // Find active token in db
    const existingTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (existingTokens.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link. Please request a new password reset.' },
        { status: 400 }
      );
    }

    const tokenRow = existingTokens[0];
    const newPasswordHash = hashPassword(newPassword);

    // Update user password hash
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, tokenRow.userId));

    // Delete token after successful use
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    // Clear existing active sessions for security so user must log in again with new password
    await db
      .delete(sessions)
      .where(eq(sessions.userId, tokenRow.userId));

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully.',
    });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
