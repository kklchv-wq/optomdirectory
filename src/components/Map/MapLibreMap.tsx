'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PracticeListing } from '@/types';
import { MAP_STYLE_URL, OSM_ATTRIBUTION } from '@/config/map';
import { AlertCircle } from 'lucide-react';

interface MapLibreMapProps {
  practices: PracticeListing[];
  center: { lat: number; lng: number };
  hoveredId: number | null;
  selectedPractice: PracticeListing | null;
  onSelectPractice: (practice: PracticeListing | null) => void;
}

export default function MapLibreMap({
  practices,
  center,
  hoveredId,
  selectedPractice,
  onSelectPractice,
}: MapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Keep refs up-to-date for async map callbacks
  const practicesRef = useRef<PracticeListing[]>(practices);
  useEffect(() => {
    practicesRef.current = practices;
  }, [practices]);

  const centerRef = useRef(center);
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  function updateMapSource(
    map: maplibregl.Map,
    currentPractices: PracticeListing[],
    currentCenter: { lat: number; lng: number }
  ) {
    const source = map.getSource('optom-practices') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Build GeoJSON collection containing strictly matching practices
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: currentPractices.map((p) => ({
        type: 'Feature',
        id: p.id,
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude],
        },
        properties: {
          id: p.id,
          practiceName: p.practiceName,
          slug: p.slug,
          city: p.city,
          postcode: p.postcode,
          specialities: p.specialities.map((s) => s.name).join(', '),
        },
      })),
    };

    source.setData(geojson);

    // Close open popup if active
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Refit map bounds to cover matching practices or search center
    if (currentPractices.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      currentPractices.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      bounds.extend([currentCenter.lng, currentCenter.lat]);
      map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 800 });
    } else {
      map.flyTo({ center: [currentCenter.lng, currentCenter.lat], zoom: 12 });
    }
  }

  // Initialize MapLibre GL JS map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: [center.lng, center.lat],
        zoom: 12,
        attributionControl: false,
      });

      // Custom Attribution
      map.addControl(
        new maplibregl.AttributionControl({
          customAttribution: OSM_ATTRIBUTION,
          compact: false,
        }),
        'bottom-right'
      );

      // Navigation Control (+ / - zoom)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('error', (e) => {
        console.warn('MapLibre style or tile load warning:', e);
      });

      map.on('load', () => {
        // Add GeoJSON Cluster Source
        map.addSource('optom-practices', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // 1. Cluster Circles Layer
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'optom-practices',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#0d9488', // Teal-600
            'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 10, 24],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // 2. Cluster Count Text Layer
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'optom-practices',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // 3. Unclustered Individual Practice Pins Layer
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'optom-practices',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#0f766e', // Hovered dark teal
              '#0d9488', // Default teal
            ],
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              8,
              6,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Click on cluster expands bounds
        map.on('click', 'clusters', async (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource('optom-practices') as maplibregl.GeoJSONSource;
          if (source && typeof clusterId === 'number') {
            try {
              const zoom = await source.getClusterExpansionZoom(clusterId);
              const geom = features[0].geometry as GeoJSON.Point;
              map.easeTo({
                center: geom.coordinates as [number, number],
                zoom: zoom || 14,
              });
            } catch (err) {
              console.error('Cluster zoom expansion error:', err);
            }
          }
        });

        // Click on pin opens Popup
        map.on('click', 'unclustered-point', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['unclustered-point'],
          });
          if (!features.length) return;

          const props = features[0].properties;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates.slice() as [
            number,
            number
          ];

          const practice = practicesRef.current.find((p) => p.id === props.id);
          if (practice) {
            onSelectPractice(practice);
            showPopup(map, coords, practice);
          }
        });

        // Cursor pointer styling on hover
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', () => {
          map.getCanvas().style.cursor = '';
        });

        // Load initial GeoJSON features
        updateMapSource(map, practicesRef.current, centerRef.current);
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Failed to initialize MapLibre:', err);
      setMapError('Map tiles could not be loaded. List results remain fully functional below.');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync GeoJSON source whenever practices or center update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    updateMapSource(map, practices, center);
  }, [practices, center]);

  // Sync list hover state with map feature state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hoveredId !== null) {
      const target = practices.find((p) => p.id === hoveredId);
      if (target) {
        map.setFeatureState(
          { source: 'optom-practices', id: target.id },
          { hover: true }
        );
      }
    }
  }, [hoveredId, practices]);

  // Sync list click with map flyTo & popup trigger
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPractice) return;

    map.flyTo({
      center: [selectedPractice.longitude, selectedPractice.latitude],
      zoom: 14,
      duration: 1000,
    });

    showPopup(
      map,
      [selectedPractice.longitude, selectedPractice.latitude],
      selectedPractice
    );
  }, [selectedPractice]);

  function showPopup(
    map: maplibregl.Map,
    coords: [number, number],
    practice: PracticeListing
  ) {
    if (popupRef.current) {
      popupRef.current.remove();
    }

    const specsHtml = practice.specialities
      .slice(0, 3)
      .map(
        (s) =>
          `<span style="background:#e6fffa; color:#0d9488; border:1px solid #ccfbf1; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600; margin-right:4px; display:inline-block; margin-bottom:2px;">${s.name}</span>`
      )
      .join('');

    const popupHtml = `
      <div style="padding:4px; font-family:system-ui,-apple-system,sans-serif; max-width:240px;">
        <h4 style="margin:0 0 2px 0; font-size:14px; font-weight:800; color:#0f172a; line-height:1.2;">👨‍⚕️ ${practice.contactName}</h4>
        <p style="margin:0 0 4px 0; font-size:11.5px; font-weight:600; color:#0d9488;">🏥 ${practice.practiceName} (GOC: ${practice.gocNumber})</p>
        <p style="margin:0 0 6px 0; font-size:11px; color:#475569;">📍 ${practice.addressLine1}, ${practice.city} (${practice.postcode})</p>
        <div style="margin-bottom:8px;">${specsHtml}</div>
        <a href="/optometrist/${practice.slug}" style="display:inline-block; background:#0d9488; color:#ffffff; padding:5px 12px; border-radius:6px; font-size:11px; font-weight:700; text-decoration:none; box-shadow:0 1px 2px rgba(0,0,0,0.1);">View Full Listing &rarr;</a>
      </div>
    `;

    popupRef.current = new maplibregl.Popup({ offset: 15, closeButton: true })
      .setLngLat(coords)
      .setHTML(popupHtml)
      .addTo(map);
  }

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[350px] bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-6 text-center text-slate-600">
        <div className="space-y-2 max-w-sm">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-xs">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
