import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  type: 'submission_received' | 'listing_approved' | 'listing_rejected' | 'password_reset';
  metadata?: Record<string, unknown>;
}

export interface MailerService {
  sendEmail(payload: EmailPayload): Promise<void>;
}

/**
 * Local Development Mailer Implementation
 * Log emails to console and write JSON files to ./dev-emails/
 */
export class DevMailer implements MailerService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'dev-emails');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${payload.type}_${payload.to.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = path.join(this.outputDir, filename);

    const emailData = {
      timestamp: new Date().toISOString(),
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || null,
      type: payload.type,
      metadata: payload.metadata || {},
    };

    console.log('\n=================== LOCAL DEV EMAIL ===================');
    console.log(`TYPE:    ${payload.type}`);
    console.log(`TO:      ${payload.to}`);
    console.log(`SUBJECT: ${payload.subject}`);
    console.log('-------------------------------------------------------');
    console.log(payload.text);
    console.log('=======================================================\n');

    try {
      fs.writeFileSync(filePath, JSON.stringify(emailData, null, 2), 'utf-8');
      console.log(`[DevMailer] Saved email log to: ${filePath}`);
    } catch (err) {
      console.error('[DevMailer] Failed to write email file:', err);
    }
  }
}

/**
 * Production Resend Mailer Implementation
 */
export class ResendMailer implements MailerService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
    // Use RESEND_FROM_EMAIL if set (e.g., "Optom Directory <noreply@optomdirectory.co.uk>")
    // Default to Resend testing sender domain if not yet configured
    this.defaultFrom = process.env.RESEND_FROM_EMAIL || 'Optom Directory <onboarding@resend.dev>';
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html || payload.text.replace(/\n/g, '<br/>'),
      });

      if (error) {
        console.error('[ResendMailer] Error sending email via Resend:', error);
        return;
      }

      console.log(`[ResendMailer] Email sent successfully via Resend. ID: ${data?.id}`);
    } catch (err) {
      console.error('[ResendMailer] Exception sending email:', err);
    }
  }
}

/**
 * Smart Mailer Factory
 * Dynamically uses ResendMailer if RESEND_API_KEY is defined in environment variables,
 * otherwise defaults to DevMailer for local testing.
 */
class DynamicMailer implements MailerService {
  async sendEmail(payload: EmailPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      const resendMailer = new ResendMailer(apiKey);
      return resendMailer.sendEmail(payload);
    } else {
      const devMailer = new DevMailer();
      return devMailer.sendEmail(payload);
    }
  }
}

// Single exported mailer instance
export const mailer: MailerService = new DynamicMailer();

