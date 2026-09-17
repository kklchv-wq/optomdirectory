'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PracticeListing } from '@/types';
import { MapPin, ChevronRight, Building2 } from 'lucide-react';

interface PracticeCardProps {
  practice: PracticeListing;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  onSelect: (practice: PracticeListing) => void;
}

export default function PracticeCard({
  practice,
  isHovered,
  onHover,
  onSelect,
}: PracticeCardProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  return (
    <div
      onMouseEnter={() => onHover(practice.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(practice)}
      className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isHovered
          ? 'bg-teal-50/70 border-teal-500 shadow-md ring-1 ring-teal-500'
          : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-teal-700">
            {practice.contactName}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{practice.practiceName}</span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {practice.addressLine1}, {practice.city} ({practice.postcode})
            </span>
          </div>
        </div>

        {typeof practice.distanceMiles === 'number' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 shrink-0 border border-teal-200">
            {practice.distanceMiles} mi away
          </span>
        )}
      </div>

      {practice.description && (
        <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {practice.description}
        </p>
      )}

      {practice.specialities && practice.specialities.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {(showAllTags ? practice.specialities : practice.specialities.slice(0, 5)).map((spec) => {
              const isPersonal = spec.offeredBy === 'personal';
              const isEquipment = spec.category === 'equipment';
              const isReferralOnly = spec.referralType === 'referral_required';
              const isSelfReferral = spec.referralType === 'self_referral';
              return (
                <span
                  key={spec.id}
                  title={spec.name}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-medium border ${
                    isPersonal
                      ? 'bg-teal-50 text-teal-950 border-teal-200'
                      : isEquipment
                      ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                      : 'bg-slate-50 text-slate-900 border-slate-200'
                  }`}
                >
                  {spec.offeredBy === 'personal' ? (
                    <span>👤</span>
                  ) : spec.offeredBy === 'practice' ? (
                    <span>🏥</span>
                  ) : null}
                  <span>{spec.name}</span>
                  {isReferralOnly ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100/70 border border-red-200 px-1.5 py-0.2 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      <span>Required</span>
                    </span>
                  ) : isSelfReferral ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>Self</span>
                    </span>
                  ) : null}
                </span>
              );
            })}

            {practice.specialities.length > 5 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllTags(!showAllTags);
                }}
                className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                {showAllTags ? 'Show less' : `+${practice.specialities.length - 5} more`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
        <Link
          href={`/optometrist/${practice.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Listing</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
