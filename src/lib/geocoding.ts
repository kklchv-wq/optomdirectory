import fs from 'fs';
import path from 'path';

// --- Nominatim Rate Limiting & File Cache ---
const CACHE_FILE_PATH = path.join(process.cwd(), 'dev-emails', 'geocode-cache.json');
let lastNominatimCallTimestamp = 0;

interface NominatimResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface GeocodeCache {
  [query: string]: NominatimResult;
}

function loadCache(): GeocodeCache {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore cache load errors
  }
  return {};
}

function saveCache(cache: GeocodeCache) {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Ignore cache save errors
  }
}

/**
 * Server-side Nominatim address geocoder with 1 request/sec rate limiting & caching.
 * NEVER call this directly from client components.
 */
export async function geocodeAddressWithNominatim(
  addressString: string
): Promise<NominatimResult | null> {
  const normalizedQuery = addressString.trim().toLowerCase();
  const cache = loadCache();

  if (cache[normalizedQuery]) {
    console.log(`[Nominatim Cache HIT]: "${addressString}"`);
    return cache[normalizedQuery];
  }

  // Enforce 1 second rate-limiting window
  const now = Date.now();
  const elapsedSinceLastCall = now - lastNominatimCallTimestamp;
  if (elapsedSinceLastCall < 1000) {
    const waitMs = 1000 - elapsedSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastNominatimCallTimestamp = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      addressString
    )}&limit=1&countrycodes=gb`;

    console.log(`[Nominatim HTTP Request]: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OptomDirectoryUK/1.0 (local-dev-referral-directory@example.com)',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const result: NominatimResult = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };

      // Save to cache
      cache[normalizedQuery] = result;
      saveCache(cache);

      return result;
    }
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
  }

  return null;
}

export interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
  adminDistrict: string;
}

/**
 * Server-side postcodes.io client for UK postcodes.
 */
export async function lookupUkPostcode(
  postcode: string
): Promise<PostcodeResult | null> {
  const cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanPostcode) return null;

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.status === 200 && data.result) {
      return {
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
        adminDistrict: data.result.admin_district || data.result.parish || '',
      };
    }
  } catch (error) {
    console.error('Postcodes.io lookup error:', error);
  }

  return null;
}
