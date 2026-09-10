/**
 * Map Configuration
 * Use MapLibre GL JS with OpenFreeMap vector tile style (keyless, free, no usage limits).
 */

// OpenFreeMap vector style URL (Primary keyless vector source)
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Raster OSM Fallback (uncomment if vector style is ever unreachable)
// export const MAP_STYLE_URL = {
//   version: 8,
//   sources: {
//     'osm-tiles': {
//       type: 'raster',
//       tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
//       tileSize: 256,
//       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//     },
//   },
//   layers: [
//     {
//       id: 'osm-tiles-layer',
//       type: 'raster',
//       source: 'osm-tiles',
//       minzoom: 0,
//       maxzoom: 19,
//     },
//   ],
// };

// Default Aberdeen City Centre coordinates
export const DEFAULT_MAP_CENTER = {
  lat: 57.1497,
  lng: -2.0943,
};

export const DEFAULT_ZOOM = 12;

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | MapLibre';
