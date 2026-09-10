'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Stethoscope, Microchip, Check } from 'lucide-react';
import { Speciality } from '@/types';

interface HeaderSearchProps {
  onSelectTag?: (slug: string) => void;
  selectedSlugs?: string[];
}

export default function HeaderSearch({ onSelectTag, selectedSlugs = [] }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSpecialities() {
      try {
        const res = await fetch('/api/specialities');
        if (res.ok) {
          const data = await res.json();
          setSpecialities(data);
        }
      } catch (err) {
        console.error('Failed to fetch specialities for header search:', err);
      }
    }
    loadSpecialities();
  }, []);

  // Filter matches
  const matches = query.trim() === ''
    ? []
    : specialities.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.groupName && item.groupName.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      });

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (slug: string) => {
    if (onSelectTag) {
      onSelectTag(slug);
    } else {
      router.push(`/?tag=${slug}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < matches.length) {
        handleSelect(matches[selectedIndex].slug);
      } else if (matches.length > 0) {
        handleSelect(matches[0].slug);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md mx-2 sm:mx-4">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search services or equipment..."
          className="w-full pl-9 pr-8 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-full text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-500 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-suggest Dropdown Panel */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500 text-center">
              No matching clinical services or equipment found for "{query}".
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Suggested Tags ({matches.length})
              </div>
              {matches.map((item, idx) => {
                const isSelectedInFilter = selectedSlugs.includes(item.slug);
                const isFocused = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isFocused ? 'bg-teal-50 text-teal-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          item.category === 'equipment'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {item.category === 'equipment' ? (
                          <Microchip className="w-3.5 h-3.5" />
                        ) : (
                          <Stethoscope className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </div>
                        {item.groupName && (
                          <div className="text-[10px] text-slate-500 font-semibold truncate">
                            {item.groupName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isSelectedInFilter ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> Filtered
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-teal-700 hover:underline">
                          Select Tag +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
