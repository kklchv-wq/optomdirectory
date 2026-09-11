export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tagAlerts } from '@/db/schema';
import { mailer } from '@/lib/mailer';

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
      : 'All Specialities & Equipment';

    const normalizedEmail = email.trim().toLowerCase();
    const radiusVal = typeof radiusMiles === 'number' ? radiusMiles : 500;

    // Save subscription in database
    const [alertRecord] = await db
      .insert(tagAlerts)
      .values({
        email: normalizedEmail,
        postcode: postcode ? postcode.trim() : null,
        radiusMiles: radiusVal,
        specialities: specialitiesStr,
        createdAt: new Date(),
      })
      .returning();

    // Trigger instant confirmation email via Resend
    await mailer.sendEmail({
      to: normalizedEmail,
      subject: 'Subscription Confirmed — Optom Directory Alerts',
      type: 'alert_subscription_confirmed',
      text: `Hello,

Thank you for subscribing to Optom Directory alerts!

We have confirmed your email subscription for ${normalizedEmail}. You will receive instant email notifications whenever a new optometrist or practice registering specialized services goes live on the UK directory.

Your Alert Preferences:
- Services / Tags: ${specialitiesStr}
- Distance Radius: ${radiusVal >= 500 ? 'UK Wide' : `${radiusVal} miles`}
${postcode ? `- Postcode / Location: ${postcode}` : ''}

Best regards,
Optom Directory Team
https://optomdirectory.co.uk`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f766e; margin-top: 0;">Subscription Confirmed!</h2>
          <p style="color: #334155; font-size: 15px;">Hello,</p>
          <p style="color: #334155; font-size: 15px;">Thank you for subscribing to <strong>Optom Directory Alerts</strong>.</p>
          <p style="color: #334155; font-size: 14px;">You will receive instant email notifications whenever a new optometrist or practice registering specialized procedures goes live.</p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
            <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 13px; text-transform: uppercase;">Your Alert Preferences:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
              <li><strong>Email:</strong> ${normalizedEmail}</li>
              <li><strong>Services / Tags:</strong> ${specialitiesStr}</li>
              <li><strong>Distance Radius:</strong> ${radiusVal >= 500 ? 'UK Wide' : `${radiusVal} miles`}</li>
              ${postcode ? `<li><strong>Location:</strong> ${postcode}</li>` : ''}
            </ul>
          </div>

          <p style="margin: 24px 0;">
            <a href="https://optomdirectory.co.uk" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Browse Live Directory</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Optom Directory — UK Optometrist Speciality & Equipment Directory</p>
        </div>
      `,
      metadata: {
        alertId: alertRecord.id,
        specialities: specialitiesStr,
      },
    });

    return NextResponse.json({
      success: true,
      message: "You're registered! A confirmation email has been sent to your inbox.",
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
