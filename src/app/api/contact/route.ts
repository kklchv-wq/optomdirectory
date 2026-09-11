export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().default('general'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    await db.insert(contactMessages).values({
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      subject: validatedData.subject,
      message: validatedData.message,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received by the UK Optom Directory team.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid form input' },
        { status: 400 }
      );
    }
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending your message. Please try again.' },
      { status: 500 }
    );
  }
}
