import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/db';
import { listings, specialities, listingSpecialities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Header from '@/components/UI/Header';
import StaticMap from '@/components/Map/StaticMap';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Edit3,
} from 'lucide-react';

import ShareReferralToolbar from '@/components/Directory/ShareReferralToolbar';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getListingData(slug: string) {
  const practiceList = await db
    .select()
    .from(listings)
    .where(and(eq(listings.slug, slug), eq(listings.status, 'approved')));

  if (practiceList.length === 0) {
    return null;
  }

  const practice = practiceList[0];

  const practiceSpecialities = await db
    .select({
      id: specialities.id,
      name: specialities.name,
      slug: specialities.slug,
      category: specialities.category,
      groupName: specialities.groupName,
      description: specialities.description,
      offeredBy: listingSpecialities.offeredBy,
      referralType: listingSpecialities.referralType,
    })
    .from(listingSpecialities)
    .innerJoin(
      specialities,
      eq(listingSpecialities.specialityId, specialities.id)
    )
    .where(eq(listingSpecialities.listingId, practice.id));

  return {
    ...practice,
    specialities: practiceSpecialities,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const practice = await getListingData(resolvedParams.slug);

  if (!practice) {
    return {
      title: 'Practice Not Found | Optom Directory',
    };
  }

  return {
    title: `${practice.practiceName} - Optometry Referral Directory`,
    description: `Specialist optometry practice in ${practice.city} offering ${practice.specialities.map((s) => s.name).join(', ')}. Contact ${practice.contactName} (GOC: ${practice.gocNumber}).`,
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const practice = await getListingData(resolvedParams.slug);

  if (!practice) {
    notFound();
  }

  const personalSpecialities = practice.specialities.filter((s) => s.offeredBy === 'personal');
  const practiceSpecialities = practice.specialities.filter((s) => s.offeredBy !== 'personal');

  // OpenStreetMap directions link
  const osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${practice.latitude},${practice.longitude}`;

  // JSON-LD LocalBusiness Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `https://optomdirectory.example.com/optometrist/${practice.slug}`,
    name: practice.practiceName,
    description: practice.description || undefined,
    telephone: practice.phone,
    email: practice.email,
    url: practice.website || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [practice.addressLine1, practice.addressLine2]
        .filter(Boolean)
        .join(', '),
      addressLocality: practice.city,
      postalCode: practice.postcode,
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: practice.latitude,
      longitude: practice.longitude,
    },
    medicalSpecialty: practice.specialities.map((s) => s.name),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Inject LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Action Bar: Back Link & Edit / Share Toolbars */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors border border-teal-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory Search</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {practice.editToken && (
              <>
                <Link
                  href={`/edit/${practice.editToken}?step=3`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-teal-50 hover:text-teal-900 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Edit Services</span>
                </Link>
                <Link
                  href={`/edit/${practice.editToken}?step=1`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Practice</span>
                </Link>
              </>
            )}
            <ShareReferralToolbar practice={practice} />
          </div>
        </div>

        {/* Main Listing Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-teal-400 text-slate-950">
                    GOC: {practice.gocNumber}
                  </span>
                </div>

                {/* Primary Headline: Practitioner Name */}
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {practice.contactName}
                </h1>

                {/* Practice & Location */}
                <div className="text-xs sm:text-sm text-teal-100 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{practice.practiceName}</span>
                  </span>
                  <span className="text-teal-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>
                      {practice.addressLine1}
                      {practice.addressLine2 ? `, ${practice.addressLine2}` : ''},{' '}
                      {practice.city} ({practice.postcode})
                    </span>
                  </span>
                </div>
              </div>

              <a
                href={osmDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions (OSM)</span>
              </a>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Details & Specialities */}
            <div className="md:col-span-7 space-y-6">
              {/* Description */}
              {practice.description && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Practice Profile & Clinical Overview
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                    {practice.description}
                  </p>
                </div>
              )}

              {/* 1. Offered by Practitioner */}
              {personalSpecialities.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤 Offered by {practice.contactName}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5">
                    {personalSpecialities.map((spec) => (
                      <div
                        key={spec.id}
                        className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{spec.name}</h4>
                            <div>
                              {spec.referralType === 'referral_required' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                  <span>Referral Required</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>Self-Referral</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {spec.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {spec.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Available in Practice */}
              {practiceSpecialities.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏥 Available in practice</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5">
                    {practiceSpecialities.map((spec) => (
                      <div
                        key={spec.id}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{spec.name}</h4>
                            <div>
                              {spec.referralType === 'referral_required' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                  <span>Referral Required</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>Self-Referral</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {spec.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {spec.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Contact & Location Map */}
            <div className="md:col-span-5 space-y-6">
              {/* Contact Card */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Referral & Contact Details
                </h3>

                <div className="space-y-3 text-xs">
                  <a
                    href={`tel:${practice.phone}`}
                    className="flex items-center gap-3 text-slate-700 hover:text-teal-700 font-medium group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-teal-600 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Telephone</span>
                      <span className="font-semibold text-sm">{practice.phone}</span>
                    </div>
                  </a>

                  <a
                    href={`mailto:${practice.email}`}
                    className="flex items-center gap-3 text-slate-700 hover:text-teal-700 font-medium group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-teal-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Referral Email</span>
                      <span className="font-semibold">{practice.email}</span>
                    </div>
                  </a>

                  {practice.website && (
                    <a
                      href={practice.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-slate-700 hover:text-teal-700 font-medium group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-teal-600 shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase">Website</span>
                        <span className="font-semibold truncate block max-w-[200px]">
                          {practice.website.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Location Map Overview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Location Preview
                </h3>
                <StaticMap
                  latitude={practice.latitude}
                  longitude={practice.longitude}
                  practiceName={practice.practiceName}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
