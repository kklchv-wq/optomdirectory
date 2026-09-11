/**
 * IMPORTANT: The seed data below contains OBVIOUSLY FICTIONAL PRACTICES.
 * Do NOT use real optometry business names, addresses, phone numbers, or GOC numbers.
 * All phone numbers use the official UK Ofcom fictional range (07700 900xxx),
 * and emails use the reserved RFC 2606 domain example.com.
 */

import { eq } from 'drizzle-orm';
import { db } from './index';
import { specialities } from './schema';
import { INITIAL_SPECIALITIES } from './initialSpecialities';

async function seed() {
  console.log('Seeding specialities taxonomy (safe upsert)...');

  for (const item of INITIAL_SPECIALITIES) {
    const existing = await db
      .select()
      .from(specialities)
      .where(eq(specialities.slug, item.slug));

    if (existing.length === 0) {
      await db.insert(specialities).values(item);
    } else {
      await db
        .update(specialities)
        .set({
          name: item.name,
          category: item.category,
          groupName: item.groupName,
          description: item.description,
        })
        .where(eq(specialities.slug, item.slug));
    }
  }

  console.log('Specialities taxonomy seeding completed successfully.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
