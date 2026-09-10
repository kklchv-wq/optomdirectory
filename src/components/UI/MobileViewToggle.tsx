'use client';

import { List, Map as MapIcon } from 'lucide-react';

interface MobileViewToggleProps {
  viewMode: 'list' | 'map';
  onChange: (mode: 'list' | 'map') => void;
  count: number;
}

export default function MobileViewToggle({
  viewMode,
  onChange,
  count,
}: MobileViewToggleProps) {
  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center bg-slate-900/90 backdrop-blur-md text-white p-1 rounded-full shadow-lg border border-slate-700/50">
        <button
          type="button"
          onClick={() => onChange('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            viewMode === 'list'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <List className="w-4 h-4" />
          <span>List ({count})</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            viewMode === 'map'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Map</span>
        </button>
      </div>
    </div>
  );
}
