'use client';

import { useState } from 'react';
import { Speciality } from '@/types';
import {
  Stethoscope,
  Microchip,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

interface FilterChipsProps {
  specialities: Speciality[];
  selectedSlugs: string[];
  onChange: (selectedSlugs: string[]) => void;
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
}: FilterChipsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const services = specialities.filter((s) => s.category === 'service' || !s.category);
  const equipment = specialities.filter((s) => s.category === 'equipment');

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
  };

  const selectedSpecialities = specialities.filter((s) => selectedSlugs.includes(s.slug));

  return (
    <div className="w-full bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
      {/* Top Bar: Title, Active Chips Summary when collapsed, & Controls */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>What are you looking for?</span>
            <span className="text-[11px] font-medium text-slate-500 font-mono">
              ({specialities.length})
            </span>
          </span>

          {/* If collapsed and has selected filters, show compact active badges */}
          {isCollapsed && selectedSpecialities.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedSpecialities.map((spec) => (
                <span
                  key={spec.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-700 text-white shadow-2xs"
                >
                  {spec.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {selectedSlugs.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({selectedSlugs.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs"
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

      {/* Main Options Grid (Hidden when collapsed) */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-teal-500 ${
                              isSelected
                                ? 'bg-teal-700 text-white shadow-2xs'
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-indigo-500 ${
                              isSelected
                                ? 'bg-indigo-700 text-white shadow-2xs'
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
  );
}
