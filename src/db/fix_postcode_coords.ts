import { db } from './index';
import { listings } from './schema';
import { eq } from 'drizzle-orm';
import { lookupUkPostcode } from '../lib/geocoding';

async function fixCoords() {
  console.log('Fixing practice coordinates using pinpoint UK postcodes...');
  const allListings = await db.select().from(listings);

  for (const practice of allListings) {
    if (practice.postcode) {
      const pc = await lookupUkPostcode(practice.postcode);
      if (pc) {
        console.log(
          `Updating "${practice.practiceName}" (${practice.postcode}) -> Lat: ${pc.latitude}, Lng: ${pc.longitude}`
        );
        await db
          .update(listings)
          .set({
            latitude: pc.latitude,
            longitude: pc.longitude,
          })
          .where(eq(listings.id, practice.id));
      }
    }
  }

  console.log('Postcode coordinate precision fix completed successfully!');
}

fixCoords().catch((err) => {
  console.error('Fix failed:', err);
  process.exit(1);
});
