export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specialities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/slug';

function checkAdminAuth(request: NextRequest): boolean {
  const adminCookie = request.cookies.get('admin_session')?.value;
  const adminHeader = request.headers.get('x-admin-password');
  return adminCookie === 'authenticated' || adminHeader === 'admin123';
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, groupName, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = generateSlug(cleanName, category || 'service');

    // Check if slug exists
    const existing = await db
      .select()
      .from(specialities)
      .where(eq(specialities.slug, slug));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A tag with this name already exists.' },
        { status: 400 }
      );
    }

    const [newTag] = await db
      .insert(specialities)
      .values({
        name: cleanName,
        slug,
        category: (category === 'equipment' ? 'equipment' : 'service') as 'service' | 'equipment',
        groupName: groupName ? groupName.trim() : 'General',
        description: description ? description.trim() : null,
      })
      .returning();

    return NextResponse.json({ tag: newTag });
  } catch (error) {
    console.error('Failed to create speciality tag:', error);
    return NextResponse.json(
      { error: 'Failed to create speciality tag' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, category, groupName, description } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'Tag ID and name are required' }, { status: 400 });
    }

    const cleanName = name.trim();

    const [updatedTag] = await db
      .update(specialities)
      .set({
        name: cleanName,
        category: (category === 'equipment' ? 'equipment' : 'service') as 'service' | 'equipment',
        groupName: groupName ? groupName.trim() : 'General',
        description: description ? description.trim() : null,
      })
      .where(eq(specialities.id, id))
      .returning();

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('Failed to update speciality tag:', error);
    return NextResponse.json(
      { error: 'Failed to update speciality tag' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'Tag ID parameter is required' }, { status: 400 });
    }

    const tagId = parseInt(idParam, 10);

    await db.delete(specialities).where(eq(specialities.id, tagId));

    return NextResponse.json({ success: true, id: tagId });
  } catch (error) {
    console.error('Failed to delete speciality tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete speciality tag' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, groupName, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const updates: Partial<typeof specialities.$inferInsert> = {
      status: status === 'approved' ? 'approved' : 'pending',
    };

    if (groupName) updates.groupName = groupName.trim();
    if (category) updates.category = category === 'equipment' ? 'equipment' : 'service';

    const [updatedTag] = await db
      .update(specialities)
      .set(updates)
      .where(eq(specialities.id, id))
      .returning();

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('Failed to update speciality status:', error);
    return NextResponse.json(
      { error: 'Failed to update speciality status' },
      { status: 500 }
    );
  }
}
