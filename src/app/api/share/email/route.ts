import { NextResponse } from 'next/server';
import { mailer } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientEmail, practiceName, contactName, gocNumber, phone, email, website, specialities, pageUrl } = body;

    if (!patientEmail || typeof patientEmail !== 'string' || !patientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid patient email address.' },
        { status: 400 }
      );
    }

    const subject = `Optometry Practitioner Details: ${contactName} (${practiceName})`;

    const specialitiesText = Array.isArray(specialities)
      ? specialities.map((s: { name: string; referralType?: string }) =>
          `• ${s.name} (${s.referralType === 'referral_required' ? 'Referral Required' : 'Self-Referral Allowed'})`
        ).join('\n')
      : 'None listed';

    const plainText = `Hello,

Here are the details for ${contactName} at ${practiceName}:

👨‍⚕️ Optometrist: ${contactName} (GOC: ${gocNumber || 'N/A'})
🏥 Practice: ${practiceName}
📞 Phone: ${phone}
✉️ Email: ${email}
${website ? `🌐 Website: ${website}\n` : ''}
Registered Services & Diagnostic Equipment:
${specialitiesText}

${pageUrl ? `View full online profile:\n${pageUrl}\n` : ''}
Sent via Optom Directory`;

    const htmlSpecialities = Array.isArray(specialities)
      ? specialities.map((s: { name: string; referralType?: string }) => `
        <li style="margin-bottom: 6px; color: #1e293b;">
          <strong>${s.name}</strong> 
          <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background-color: ${s.referralType === 'referral_required' ? '#fee2e2; color: #991b1b' : '#dcfce7; color: #166534'};">
            ${s.referralType === 'referral_required' ? 'Referral Required' : 'Self-Referral Allowed'}
          </span>
        </li>
      `).join('')
      : '<li>No specialities specified</li>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #0f172a; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { background: #0f766e; color: #ffffff; padding: 24px; }
            .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
            .header p { margin: 0; font-size: 13px; color: #ccfbf1; }
            .body { padding: 24px; }
            .info-box { background: #f1f5f9; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 13px; }
            .info-row { margin-bottom: 8px; }
            .info-row:last-child { margin-bottom: 0; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; padding: 16px; border-top: 1px solid #f1f5f9; }
            .btn { display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 12px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>${contactName}</h2>
              <p>${practiceName} ${gocNumber ? `• GOC: ${gocNumber}` : ''}</p>
            </div>
            <div class="body">
              <div class="info-box">
                <div class="info-row"><strong>📞 Phone:</strong> <a href="tel:${phone}" style="color: #0f766e; text-decoration: none;">${phone}</a></div>
                <div class="info-row"><strong>✉️ Email:</strong> <a href="mailto:${email}" style="color: #0f766e; text-decoration: none;">${email}</a></div>
                ${website ? `<div class="info-row"><strong>🌐 Website:</strong> <a href="${website}" target="_blank" style="color: #0f766e; text-decoration: none;">${website}</a></div>` : ''}
              </div>

              <h4 style="font-size: 13px; text-transform: uppercase; color: #475569; margin: 0 0 10px 0;">Registered Services & Diagnostic Equipment:</h4>
              <ul style="padding-left: 20px; font-size: 13px; margin: 0 0 20px 0;">
                ${htmlSpecialities}
              </ul>

              ${pageUrl ? `<a href="${pageUrl}" target="_blank" class="btn">View Online Directory Listing</a>` : ''}
            </div>
            <div class="footer">
              Sent via Optom Directory — Optometry Referral Network
            </div>
          </div>
        </body>
      </html>
    `;

    await mailer.sendEmail({
      to: patientEmail,
      subject,
      text: plainText,
      html: htmlContent,
      type: 'submission_received',
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully to patient.' });
  } catch (err) {
    console.error('Error sending patient email:', err);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again or use your local mail app.' },
      { status: 500 }
    );
  }
}
