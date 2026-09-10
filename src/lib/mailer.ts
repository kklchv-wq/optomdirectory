import fs from 'fs';
import path from 'path';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  type: 'submission_received' | 'listing_approved' | 'listing_rejected';
  metadata?: Record<string, unknown>;
}

export interface MailerService {
  sendEmail(payload: EmailPayload): Promise<void>;
}

/**
 * Local Development Mailer Implementation
 * Log emails to console and write JSON files to ./dev-emails/
 * 
 * PRODUCTION TODO: Replace DevMailer with real email provider (e.g., Resend, SendGrid, Postmark)
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

    // 1. Output to console
    console.log('\n=================== LOCAL DEV EMAIL ===================');
    console.log(`TYPE:    ${payload.type}`);
    console.log(`TO:      ${payload.to}`);
    console.log(`SUBJECT: ${payload.subject}`);
    console.log('-------------------------------------------------------');
    console.log(payload.text);
    console.log('=======================================================\n');

    // 2. Output to file
    try {
      fs.writeFileSync(filePath, JSON.stringify(emailData, null, 2), 'utf-8');
      console.log(`[DevMailer] Saved email log to: ${filePath}`);
    } catch (err) {
      console.error('[DevMailer] Failed to write email file:', err);
    }
  }
}

// Single exported mailer instance
export const mailer: MailerService = new DevMailer();
