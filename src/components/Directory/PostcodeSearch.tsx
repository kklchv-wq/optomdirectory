'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { ukPostcodeRegex } from '@/schemas/listing';
import { GeoLocation } from '@/types';

interface PostcodeSearchProps {
  onLocationChange: (location: GeoLocation) => void;
  currentLocationLabel?: string;
}

export default function PostcodeSearch({
  onLocationChange,
}: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePostcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = postcode.trim().toUpperCase();
    if (!clean) return;

    if (!ukPostcodeRegex.test(clean)) {
      setErrorMessage('Please enter a valid UK postcode (e.g. AB10 1JJ)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/postcode/${encodeURIComponent(clean)}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        setErrorMessage(data.error || 'Postcode not found in UK database');
        return;
      }

      onLocationChange({
        lat: data.latitude,
        lng: data.longitude,
        label: `Near ${data.postcode}${data.adminDistrict ? ` (${data.adminDistrict})` : ''}`,
      });
      setPostcode('');
    } catch {
      setErrorMessage('Failed to lookup postcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNearMe = () => {
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Browser geolocation is not supported on your device.');
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Your Current Location',
        });
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage('Location permission denied. Showing default city center.');
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage('Location request timed out. Showing default city center.');
        } else {
          setErrorMessage('Unable to determine location. Showing default city center.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-1">
      <form onSubmit={handlePostcodeSubmit} className="flex items-center gap-1.5 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Search UK Postcode (e.g. AB10)"
            className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono uppercase shadow-2xs"
            aria-label="Enter UK postcode"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleNearMe}
            disabled={geoLoading}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors disabled:opacity-50 focus:outline-hidden cursor-pointer"
          >
            {geoLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
            ) : (
              <MapPin className="w-3 h-3 text-teal-600" />
            )}
            <span className="hidden sm:inline">Near Me</span>
          </button>

          <button
            type="submit"
            disabled={loading || !postcode.trim()}
            className="inline-flex items-center justify-center px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden cursor-pointer shadow-2xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
