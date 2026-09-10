import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specialities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/slug';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, groupName, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Specialty / Tag name is required' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const slug = generateSlug(cleanName, category || 'service');

    // Check if tag already exists
    const existing = await db
      .select()
      .from(specialities)
      .where(eq(specialities.slug, slug));

    if (existing.length > 0) {
      // Return existing tag so practitioner can select it directly
      return NextResponse.json({
        tag: existing[0],
        message: 'This tag already exists and has been added to your selections!',
        isExisting: true,
      });
    }

    // Insert new pending custom tag
    const [newTag] = await db
      .insert(specialities)
      .values({
        name: cleanName,
        slug,
        category: category === 'equipment' ? 'equipment' : 'service',
        groupName: groupName ? groupName.trim() : 'Custom Submissions',
        description: description ? description.trim() : undefined,
        status: 'pending', // Pending admin review
      })
      .returning();

    return NextResponse.json({
      tag: newTag,
      message: 'Custom tag submitted for directory approval and attached to your profile!',
      isExisting: false,
    });
  } catch (error) {
    console.error('Failed to submit custom speciality:', error);
    return NextResponse.json(
      { error: 'Failed to create custom specialty tag' },
      { status: 500 }
    );
  }
}
