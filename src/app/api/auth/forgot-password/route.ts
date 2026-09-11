export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mailer } from '@/lib/mailer';
import crypto from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = parseResult.data.email.trim().toLowerCase();
    console.log(`[forgot-password] Processing reset request for email: "${normalizedEmail}"`);

    // Look up user
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    console.log(`[forgot-password] Lookup result for "${normalizedEmail}": ${existingUsers.length} user(s) found.`);

    if (existingUsers.length === 0) {
      console.warn(`[forgot-password] WARNING: No user account found in production database for "${normalizedEmail}". Skipping email send.`);
    }

    // For security, always respond with a generic success message even if email is not found
    if (existingUsers.length > 0) {
      const user = existingUsers[0];

      // Delete existing reset tokens for this user
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));

      // Generate 64-char hex token (32 bytes random)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // Insert reset token
      await db.insert(passwordResetTokens).values({
        token,
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
      });

      // Construct reset URL
      const origin = request.headers.get('origin') || 'https://optomdirectory.co.uk';
      const resetUrl = `${origin}/auth/reset-password?token=${token}`;

      // Send email
      await mailer.sendEmail({
        to: user.email,
        subject: 'Reset Your Password — Optom Directory',
        type: 'password_reset',
        text: `Hello ${user.name},

You requested a password reset for your practitioner account on Optom Directory.

Click the link below to set a new password (link valid for 1 hour):
${resetUrl}

If you did not request this password reset, you can safely ignore this email.

Best regards,
Optom Directory Team`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #0f766e; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #334155; font-size: 15px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #334155; font-size: 15px;">You requested a password reset for your practitioner account on Optom Directory.</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #64748b; font-size: 13px;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #0f766e;">${resetUrl}</a></p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">This link will expire in 1 hour. If you did not request a password reset, no action is needed.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Optom Directory — UK Optometrist Directory</p>
          </div>
        `,
        metadata: {
          userId: user.id,
          token,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email address, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
