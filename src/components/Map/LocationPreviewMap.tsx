'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, OSM_ATTRIBUTION } from '@/config/map';

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
}

export default function LocationPreviewMap({
  latitude,
  longitude,
  onCoordinatesChange,
}: LocationPreviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: [longitude, latitude],
        zoom: 15,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          customAttribution: OSM_ATTRIBUTION,
          compact: true,
        }),
        'bottom-right'
      );

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      const marker = new maplibregl.Marker({
        draggable: true,
        color: '#0d9488',
      })
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            '<div style="font-size:11px; font-weight:bold; padding:2px;">Drag this pin to pinpoint your exact clinic entrance</div>'
          )
        )
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onCoordinatesChange({ lat: lngLat.lat, lng: lngLat.lng });
      });

      markerRef.current = marker;
      mapRef.current = map;
    } else {
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-1.5">
      <div className="w-full h-56 rounded-xl overflow-hidden shadow-xs border border-slate-200 relative">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
      <p className="text-[11px] text-slate-500 italic text-center">
        📍 Hint: Drag the teal marker to adjust your practice entrance location on the map.
      </p>
    </div>
  );
}
