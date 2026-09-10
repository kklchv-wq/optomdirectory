'use client';

interface DistanceSliderProps {
  radiusMiles: number;
  onChange: (radius: number) => void;
}

const PRESET_STEPS = [
  { label: '5m', value: 5 },
  { label: '25m', value: 25 },
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '🇬🇧 Nationwide', value: 500 },
];

export default function DistanceSlider({
  radiusMiles,
  onChange,
}: DistanceSliderProps) {
  const isNationwide = radiusMiles >= 500;

  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-bold text-slate-700 shrink-0">
          Radius:
        </span>
        <input
          id="distance-range"
          type="range"
          min={1}
          max={500}
          step={5}
          value={radiusMiles > 500 ? 500 : radiusMiles}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
        />
        <span className="text-xs font-extrabold text-teal-800 shrink-0 min-w-14 text-right">
          {isNationwide ? 'UK Wide' : `${radiusMiles} mi`}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {PRESET_STEPS.map((preset) => {
          const isActive =
            preset.value === 500 ? isNationwide : radiusMiles === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
