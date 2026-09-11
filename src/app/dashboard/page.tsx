'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/UI/Header';
import {
  User,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit3,
  PlusCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { PracticeListing, Speciality } from '@/types';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  gocNumber: string;
}

interface ListingWithSpecialities extends PracticeListing {
  specialities: (Speciality & {
    offeredBy: 'personal' | 'practice';
    referralType: 'referral_required' | 'self_referral';
  })[];
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('welcome') === 'new';

  const [user, setUser] = useState<AuthUser | null>(null);
  const [listing, setListing] = useState<ListingWithSpecialities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        if (!data || !data.user) {
          router.push('/auth/login');
          return;
        }
        setUser(data.user);
        setListing(data.listing);
      } catch (err) {
        console.error('Failed to load practitioner dashboard:', err);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Loading Practitioner Portal...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Redirecting to Practitioner Login...
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> GOC Verified Account
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-teal-400 text-slate-950">
              GOC: {user.gocNumber}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isNewUser ? `Welcome to Optom Directory, ${user.name}!` : `Welcome back, ${user.name}`}
          </h1>
          <p className="text-xs text-teal-100">
            Manage your optometry practice details, qualifications, diagnostic equipment, and patient referral accessibility.
          </p>
        </div>

        {listing ? (
          <Link
            href={`/edit/${listing.editToken}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Qualifications & Equipment</span>
          </Link>
        ) : (
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Practice Profile</span>
          </Link>
        )}
      </div>

      {/* Practice Profile Card */}
      {listing ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {listing.practiceName}
                </h2>
                {listing.status === 'approved' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published & Live
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Admin Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {listing.addressLine1}, {listing.city} ({listing.postcode})
                </span>
              </p>
            </div>

            {listing.status === 'approved' && (
              <Link
                href={`/optometrist/${listing.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors"
              >
                <span>View Public Listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Specialities & Equipment Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Registered Services & Equipment ({listing.specialities.length})
              </h3>
              <Link
                href={`/edit/${listing.editToken}`}
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Update Options
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {listing.specialities.map((spec) => {
                const isPersonal = spec.offeredBy === 'personal';
                const isReferralOnly = spec.referralType === 'referral_required';

                return (
                  <div
                    key={spec.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{spec.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-semibold text-slate-600">
                        {isPersonal ? '👤 Offered Myself' : '🏥 In Practice'}
                      </span>

                      {isReferralOnly ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100/80 px-2 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          <span>Referral Required</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Self-Referral</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-extrabold text-slate-900">
              No Practice Listing Linked Yet
            </h2>
            <p className="text-xs text-slate-600">
              Create your practitioner listing to display your specialized procedures, dry eye equipment, and contact lens services in the UK referral directory.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Practice Listing</span>
          </Link>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <Suspense fallback={<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading Practitioner Portal...</main>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
