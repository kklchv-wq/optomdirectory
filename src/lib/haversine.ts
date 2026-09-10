const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates Haversine distance in miles between two coordinate pairs.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Computes a latitude/longitude bounding box for a given center point and search radius in miles.
 */
export function getBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): BoundingBox {
  // 1 degree of latitude is approximately 69 miles
  const deltaLat = radiusMiles / 69.0;
  
  // 1 degree of longitude varies by latitude
  const latRad = (centerLat * Math.PI) / 180;
  const milesPerDegreeLng = 69.0 * Math.cos(latRad);
  const deltaLng = radiusMiles / (milesPerDegreeLng || 0.0001);

  return {
    minLat: centerLat - deltaLat,
    maxLat: centerLat + deltaLat,
    minLng: centerLng - deltaLng,
    maxLng: centerLng + deltaLng,
  };
}
