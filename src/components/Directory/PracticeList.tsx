'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PracticeListing } from '@/types';
import PracticeCard from './PracticeCard';
import {
  SearchX,
  RefreshCw,
  Bell,
  CheckCircle2,
  Loader2,
  Eye,
  PlusCircle,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PracticeListProps {
  practices: PracticeListing[];
  loading: boolean;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (practice: PracticeListing) => void;
  onResetFilters: () => void;
  radiusMiles: number;
  selectedSpecialitiesCount: number;
  hasActiveFilters?: boolean;
}

export default function PracticeList({
  practices,
  loading,
  hoveredId,
  onHover,
  onSelect,
  onResetFilters,
  radiusMiles,
  selectedSpecialitiesCount,
  hasActiveFilters = false,
}: PracticeListProps) {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  // 8 Practices per page pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [practices]);

  const totalPages = Math.ceil(practices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, practices.length);
  const paginatedPractices = practices.slice(startIndex, endIndex);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyError(null);
    setNotifySubmitting(true);

    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          radiusMiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotifyError(data.error || 'Failed to register alert.');
      } else {
        setNotifySuccess(true);
        setNotifyEmail('');
      }
    } catch {
      setNotifyError('Network error. Please try again.');
    } finally {
      setNotifySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4" aria-busy="true" aria-label="Loading optometrist listings">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3"
          >
            <div className="h-5 bg-slate-200 rounded-md w-2/3" />
            <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            <div className="h-12 bg-slate-100 rounded-md w-full" />
          </div>
        ))}
      </div>
    );
  }

  // 0 Results State: Differentiate between Active Search/Filter vs Initial Page Load
  if (practices.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="py-8 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <SearchX className="w-6 h-6" />
          </div>

          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              No matching practitioners found for your search criteria.
            </h3>
            <p className="text-xs text-slate-600">
              Try expanding your search radius beyond <strong>{radiusMiles >= 500 ? 'UK Wide' : `${radiusMiles} miles`}</strong> or clearing some selected filters.
            </p>
          </div>

          {/* Ultra-compact "Notify Me" Card */}
          <div className="max-w-sm mx-auto bg-teal-50/80 p-4 rounded-xl border border-teal-200 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-teal-950">
              <Bell className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-xs font-extrabold">Get an email alert when a practitioner registers:</span>
            </div>

            {notifySuccess ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You're on the list! We'll email you as soon as a matching practitioner registers.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-1.5">
                {notifyError && (
                  <div className="text-[11px] text-red-600 font-semibold">{notifyError}</div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="flex-1 px-3 py-2 bg-white border border-teal-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={notifySubmitting}
                    className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {notifySubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notify Me</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Reset Button */}
          <div>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        </div>
      );
    }

    // Default Initial Page Load (no search/filter criteria active yet)
    return (
      <div className="py-8 px-6 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
          <Eye className="w-6 h-6" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Welcome to the UK Optometry Speciality Directory
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Select a clinical service or diagnostic equipment filter above, or enter your postcode to find specialized optometry practices across the UK.
          </p>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register a Practice</span>
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
          >
            <Info className="w-4 h-4 text-slate-600" />
            <span>About Directory</span>
          </Link>
        </div>

        {/* Email Alert Box */}
        <div className="max-w-sm mx-auto bg-teal-50/80 p-4 rounded-xl border border-teal-200 text-left space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-teal-950">
            <Bell className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="text-xs font-extrabold">Get an email alert when a practitioner registers:</span>
          </div>

          {notifySuccess ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You're on the list! We'll email you as soon as a matching practitioner registers.</span>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="space-y-1.5">
              {notifyError && (
                <div className="text-[11px] text-red-600 font-semibold">{notifyError}</div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="flex-1 px-3 py-2 bg-white border border-teal-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={notifySubmitting}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {notifySubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Optometrist Search Results">
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <span>
          Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{practices.length}</strong> approved practitioner{practices.length === 1 ? '' : 's'}
        </span>
        <span>Sorted by distance</span>
      </div>

      <div className="space-y-3">
        {paginatedPractices.map((practice) => (
          <PracticeCard
            key={practice.id}
            practice={practice}
            isHovered={hoveredId === practice.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Pagination Controls (8 per page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="font-semibold text-slate-600">
            Page <strong className="text-slate-900 font-extrabold">{currentPage}</strong> of <strong className="text-slate-900 font-extrabold">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
