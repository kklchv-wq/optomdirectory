'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, OSM_ATTRIBUTION } from '@/config/map';

interface StaticMapProps {
  latitude: number;
  longitude: number;
  practiceName: string;
}

export default function StaticMap({
  latitude,
  longitude,
  practiceName,
}: StaticMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: [longitude, latitude],
        zoom: 14,
        attributionControl: false,
        interactive: true,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          customAttribution: OSM_ATTRIBUTION,
          compact: true,
        }),
        'bottom-right'
      );

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        // Single pin marker for practice
        new maplibregl.Marker({ color: '#0d9488' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family:sans-serif; font-size:12px; font-weight:bold; padding:2px;">${practiceName}</div>`
            )
          )
          .addTo(map);
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Static map initialization error:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, practiceName]);

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden shadow-xs border border-slate-200 relative">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
