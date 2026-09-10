'use client';

import { useState } from 'react';
import { ListingFormValues } from '@/schemas/listing';
import LocationPreviewMap from '@/components/Map/LocationPreviewMap';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';

interface Step2Props {
  formData: ListingFormValues;
  updateFields: (fields: Partial<ListingFormValues>) => void;
  errors: Record<string, string>;
}

export default function FormStep2Address({
  formData,
  updateFields,
  errors,
}: Step2Props) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);

  const handleGeocodeAddress = async () => {
    setGeocodeMessage(null);

    const fullAddressString = [
      formData.addressLine1,
      formData.addressLine2,
      formData.city,
      formData.postcode,
    ]
      .filter(Boolean)
      .join(', ');

    if (!formData.addressLine1 || !formData.city || !formData.postcode) {
      setGeocodeMessage('Please enter Address Line 1, City, and Postcode first.');
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddressString }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Fallback: try geocoding postcode alone via postcodes.io proxy
        const pcRes = await fetch(`/api/postcode/${encodeURIComponent(formData.postcode)}`);
        const pcData = await pcRes.json();
        if (pcRes.ok && pcData.latitude) {
          updateFields({ latitude: pcData.latitude, longitude: pcData.longitude });
          setGeocodeMessage('Geocoded via UK Postcode. Drag the pin to adjust exact entrance.');
        } else {
          setGeocodeMessage(data.error || 'Address geocoding failed. You can adjust the pin manually.');
        }
      } else {
        updateFields({ latitude: data.latitude, longitude: data.longitude });
        setGeocodeMessage('Address geocoded successfully!');
      }
    } catch {
      setGeocodeMessage('Geocoding request failed. Please check network connection.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
        Step 2: Practice Address & Map Location
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address Line 1 */}
        <div>
          <label htmlFor="addressLine1" className="block text-xs font-semibold text-slate-700">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            id="addressLine1"
            type="text"
            value={formData.addressLine1}
            onChange={(e) => updateFields({ addressLine1: e.target.value })}
            placeholder="e.g. 142 Union Street"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.addressLine1 && (
            <p className="mt-1 text-xs text-red-600">{errors.addressLine1}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="addressLine2" className="block text-xs font-semibold text-slate-700">
            Address Line 2 <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            id="addressLine2"
            type="text"
            value={formData.addressLine2 || ''}
            onChange={(e) => updateFields({ addressLine2: e.target.value })}
            placeholder="e.g. Suite 2A"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-xs font-semibold text-slate-700">
            City / Town <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => updateFields({ city: e.target.value })}
            placeholder="e.g. Aberdeen"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-600">{errors.city}</p>
          )}
        </div>

        {/* Postcode */}
        <div>
          <label htmlFor="postcode" className="block text-xs font-semibold text-slate-700">
            Postcode <span className="text-red-500">*</span>
          </label>
          <input
            id="postcode"
            type="text"
            value={formData.postcode}
            onChange={(e) => updateFields({ postcode: e.target.value.toUpperCase() })}
            onBlur={async (e) => {
              const pcVal = e.target.value.trim().toUpperCase();
              if (pcVal.length >= 5) {
                try {
                  const res = await fetch(`/api/postcode/${encodeURIComponent(pcVal)}`);
                  if (res.ok) {
                    const pcData = await res.json();
                    if (pcData.latitude && pcData.longitude) {
                      updateFields({ latitude: pcData.latitude, longitude: pcData.longitude });
                      setGeocodeMessage(`📍 Map pin placed accurately at ${pcData.postcode} coordinates`);
                    }
                  }
                } catch {
                  // Ignore background lookup errors
                }
              }
            }}
            placeholder="e.g. AB10 1JJ"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Typing a valid UK postcode automatically places your pin on the map.
          </span>
          {errors.postcode && (
            <p className="mt-1 text-xs text-red-600">{errors.postcode}</p>
          )}
        </div>
      </div>

      {/* Geocode Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            Automatic Address Geocoding
          </span>
          <span className="text-[11px] text-slate-500 block">
            Fetch map coordinates for your address (via rate-limited server Nominatim API).
          </span>
        </div>

        <button
          type="button"
          onClick={handleGeocodeAddress}
          disabled={geocoding}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          {geocoding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MapPin className="w-3.5 h-3.5" />
          )}
          <span>Locate Address on Map</span>
        </button>
      </div>

      {geocodeMessage && (
        <div className="text-xs text-teal-800 bg-teal-50 border border-teal-200 p-2.5 rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{geocodeMessage}</span>
        </div>
      )}

      {/* Draggable Map Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold">Map Coordinate Preview:</span>
          <span className="font-mono text-[11px] text-slate-500">
            Lat: {formData.latitude.toFixed(5)}, Lng: {formData.longitude.toFixed(5)}
          </span>
        </div>

        <LocationPreviewMap
          latitude={formData.latitude}
          longitude={formData.longitude}
          onCoordinatesChange={({ lat, lng }) =>
            updateFields({ latitude: lat, longitude: lng })
          }
        />
      </div>
    </div>
  );
}
