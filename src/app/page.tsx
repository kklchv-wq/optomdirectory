'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/UI/Header';
import FilterChips from '@/components/Directory/FilterChips';
import PracticeList from '@/components/Directory/PracticeList';
import MapLibreMap from '@/components/Map/MapLibreMap';
import MobileViewToggle from '@/components/UI/MobileViewToggle';
import { PracticeListing, Speciality, GeoLocation } from '@/types';
import { DEFAULT_MAP_CENTER } from '@/config/map';

import { INITIAL_SPECIALITIES } from '@/db/initialSpecialities';

export default function HomePage() {
  const [specialities, setSpecialities] = useState<Speciality[]>(
    INITIAL_SPECIALITIES.map((s, idx) => ({ id: idx + 1, ...s, status: 'approved' }))
  );
  const [selectedSpecialitySlugs, setSelectedSpecialitySlugs] = useState<string[]>([]);
  const [radiusMiles, setRadiusMiles] = useState<number>(500);
  const [location, setLocation] = useState<GeoLocation>({
    lat: DEFAULT_MAP_CENTER.lat,
    lng: DEFAULT_MAP_CENTER.lng,
    label: 'Aberdeen City Centre (Default)',
  });

  const [practices, setPractices] = useState<PracticeListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<PracticeListing | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // 1. Fetch Master Specialities List
  useEffect(() => {
    async function fetchSpecialities() {
      try {
        const res = await fetch('/api/specialities');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSpecialities(data);
          }
        }
      } catch (err) {
        console.error('Failed to load specialities:', err);
      }
    }
    fetchSpecialities();
  }, []);

  // 2. Fetch Listings when location, radius, or specialities change
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
        params.set('radius', radiusMiles.toString());
        if (selectedSpecialitySlugs.length > 0) {
          params.set('specialities', selectedSpecialitySlugs.join(','));
        }

        const res = await fetch(`/api/listings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedListings: PracticeListing[] = data.listings || [];
          setPractices(fetchedListings);

          // Clear selected practice card/pin if no longer matching current filters
          setSelectedPractice((prev) => {
            if (prev && !fetchedListings.some((p) => p.id === prev.id)) {
              return null;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [location, radiusMiles, selectedSpecialitySlugs]);

  const handleResetFilters = () => {
    setSelectedSpecialitySlugs([]);
    setRadiusMiles(500);
    setLocation({
      lat: DEFAULT_MAP_CENTER.lat,
      lng: DEFAULT_MAP_CENTER.lng,
      label: 'Aberdeen City Centre (Default)',
    });
  };

  // Read optional URL query parameter ?tag=slug on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tagParam = urlParams.get('tag');
      if (tagParam) {
        setSelectedSpecialitySlugs((prev) => (prev.includes(tagParam) ? prev : [...prev, tagParam]));
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        onSelectTag={(slug) => {
          setSelectedSpecialitySlugs((prev) =>
            prev.includes(slug) ? prev : [...prev, slug]
          );
        }}
        selectedSlugs={selectedSpecialitySlugs}
      />

      {/* Search & Filter Header */}
      <section className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FilterChips
            specialities={specialities}
            selectedSlugs={selectedSpecialitySlugs}
            onChange={setSelectedSpecialitySlugs}
            location={location}
            onLocationChange={setLocation}
            radiusMiles={radiusMiles}
            onRadiusChange={setRadiusMiles}
          />
        </div>
      </section>

      {/* Main Content Area - Split Desktop Layout / Mobile Toggle */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
          {/* Results List Column */}
          <div
            className={`lg:col-span-6 space-y-4 ${
              mobileView === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {(() => {
              const hasActiveFilters =
                selectedSpecialitySlugs.length > 0 ||
                location.label !== 'Aberdeen City Centre (Default)';
              return (
                <PracticeList
                  practices={practices}
                  loading={loading}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  onSelect={setSelectedPractice}
                  onResetFilters={handleResetFilters}
                  radiusMiles={radiusMiles}
                  selectedSpecialitiesCount={selectedSpecialitySlugs.length}
                  hasActiveFilters={hasActiveFilters}
                />
              );
            })()}
          </div>

          {/* Map Column */}
          <div
            className={`lg:col-span-6 lg:sticky lg:top-24 h-[calc(100vh-140px)] min-h-[400px] ${
              mobileView === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <MapLibreMap
              practices={practices}
              center={{ lat: location.lat, lng: location.lng }}
              hoveredId={hoveredId}
              selectedPractice={selectedPractice}
              onSelectPractice={setSelectedPractice}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating View Toggle */}
      <MobileViewToggle
        viewMode={mobileView}
        onChange={setMobileView}
        count={practices.length}
      />
    </div>
  );
}
