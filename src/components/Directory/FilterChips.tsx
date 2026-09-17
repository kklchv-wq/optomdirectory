'use client';

import { useState } from 'react';
import { GeoLocation, Speciality } from '@/types';
import PostcodeSearch from '@/components/Directory/PostcodeSearch';
import DistanceSlider from '@/components/Directory/DistanceSlider';
import {
  Stethoscope,
  Microchip,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FilterChipsProps {
  specialities: Speciality[];
  selectedSlugs: string[];
  onChange: (selectedSlugs: string[]) => void;
  location?: GeoLocation;
  onLocationChange?: (location: GeoLocation) => void;
  radiusMiles?: number;
  onRadiusChange?: (radius: number) => void;
}

function groupBySubGroup(items: Speciality[]) {
  const groups: { [group: string]: Speciality[] } = {};
  for (const item of items) {
    const key = item.groupName || 'General';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}

export default function FilterChips({
  specialities,
  selectedSlugs,
  onChange,
  location,
  onLocationChange,
  radiusMiles,
  onRadiusChange,
}: FilterChipsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'service' | 'equipment'>('all');

  const filteredSpecialities = specialities.filter((s) => {
    if (activeCategory !== 'all' && (s.category || 'service') !== activeCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.groupName && s.groupName.toLowerCase().includes(q))
    );
  });

  const services = filteredSpecialities.filter(
    (s) => s.category === 'service' || !s.category
  );
  const equipment = filteredSpecialities.filter((s) => s.category === 'equipment');

  const serviceGroups = groupBySubGroup(services);
  const equipmentGroups = groupBySubGroup(equipment);

  const toggleSpeciality = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((s) => s !== slug));
    } else {
      onChange([...selectedSlugs, slug]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearchQuery('');
    setActiveCategory('all');
  };

  return (
    <div className="w-full max-w-full overflow-hidden bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
      {/* Top Bar: Category Filter Pills on Left, Postcode & Radius Filters on Upper Right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5 max-w-full">
        {/* Left: Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('service')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeCategory === 'service'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('equipment')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeCategory === 'equipment'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              Equipment
            </button>
          </div>
        </div>

        {/* Upper Right Controls: Postcode Search + Distance Radius + Reset + Mobile Minimise */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 flex-wrap lg:flex-nowrap min-w-0 max-w-full lg:justify-end">
          {onLocationChange && (
            <div className="flex-1 min-w-[240px] sm:min-w-[280px] max-w-md">
              <PostcodeSearch
                onLocationChange={onLocationChange}
                currentLocationLabel={location?.label}
              />
            </div>
          )}

          {radiusMiles !== undefined && onRadiusChange && (
            <div className="flex-1 min-w-[180px] sm:min-w-[220px] max-w-xs bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs flex items-center">
              <DistanceSlider
                radiusMiles={radiusMiles}
                onChange={onRadiusChange}
                showPresets={false}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            {selectedSlugs.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({selectedSlugs.length})</span>
              </button>
            )}

            {/* Minimise Toggle Button - Mobile Phones ONLY */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              {isCollapsed ? (
                <>
                  <span>Show Options</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </>
              ) : (
                <>
                  <span>Hide Options</span>
                  <ChevronUp className="w-3 h-3 text-slate-500" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Options Panel (Hidden on mobile when collapsed, Always Visible on Web) */}
      <div className={`space-y-2.5 ${isCollapsed ? 'hidden sm:block' : 'block'}`}>

          {/* Options Grid - Fully Expanded (No internal scroll window) */}
          <div className="space-y-3">
            {filteredSpecialities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                No tags match "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Column 1: Clinical Services & Procedures */}
                {services.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-950 uppercase tracking-wider pb-0.5 border-b border-teal-100">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Clinical Services & Procedures</span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(serviceGroups).map(([groupName, groupItems]) => (
                        <div key={groupName} className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wide block">
                            {groupName}
                          </span>
                          <fieldset className="flex flex-wrap gap-1">
                            <legend className="sr-only">{groupName}</legend>
                            {groupItems.map((spec) => {
                              const isSelected = selectedSlugs.includes(spec.slug);
                              return (
                                <label
                                  key={spec.id}
                                  title={spec.description || undefined}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-teal-500 ${
                                    isSelected
                                      ? 'bg-teal-700 text-white shadow-2xs font-bold'
                                      : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    name="speciality-filter"
                                    value={spec.slug}
                                    checked={isSelected}
                                    onChange={() => toggleSpeciality(spec.slug)}
                                    className="sr-only"
                                  />
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                  <span>{spec.name}</span>
                                </label>
                              );
                            })}
                          </fieldset>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Column 2: Specialized Diagnostic Equipment */}
                {equipment.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-950 uppercase tracking-wider pb-0.5 border-b border-indigo-100">
                      <Microchip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Specialized Diagnostic Equipment</span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(equipmentGroups).map(([groupName, groupItems]) => (
                        <div key={groupName} className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wide block">
                            {groupName}
                          </span>
                          <fieldset className="flex flex-wrap gap-1">
                            <legend className="sr-only">{groupName}</legend>
                            {groupItems.map((item) => {
                              const isSelected = selectedSlugs.includes(item.slug);
                              return (
                                <label
                                  key={item.id}
                                  title={item.description || undefined}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-indigo-500 ${
                                    isSelected
                                      ? 'bg-indigo-700 text-white shadow-2xs font-bold'
                                      : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    name="equipment-filter"
                                    value={item.slug}
                                    checked={isSelected}
                                    onChange={() => toggleSpeciality(item.slug)}
                                    className="sr-only"
                                  />
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                  <span>{item.name}</span>
                                </label>
                              );
                            })}
                          </fieldset>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
