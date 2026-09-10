'use client';

import { useEffect, useState } from 'react';
import { ListingFormValues } from '@/schemas/listing';
import { Speciality } from '@/types';
import { ShieldCheck, MapPin, User, Phone, Mail, Globe, CheckCircle2 } from 'lucide-react';

interface Step4Props {
  formData: ListingFormValues;
}

export default function FormStep4Review({ formData }: Step4Props) {
  const [specialitiesMap, setSpecialitiesMap] = useState<Record<number, Speciality>>({});

  useEffect(() => {
    async function fetchSpecialities() {
      try {
        const res = await fetch('/api/specialities');
        if (res.ok) {
          const data: Speciality[] = await res.json();
          const map: Record<number, Speciality> = {};
          data.forEach((item) => {
            map[item.id] = item;
          });
          setSpecialitiesMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch specialities for review:', err);
      }
    }
    fetchSpecialities();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
          Step 4: Review & Confirm Submission
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Please review your practice details and referral access settings before submitting. All listings undergo admin verification before going live.
        </p>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        {/* Practice Overview */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
              Practice Name
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              {formData.practiceName}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Pending Review
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Lead Practitioner:</strong> {formData.contactName}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>GOC Number:</strong> {formData.gocNumber}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Phone:</strong> {formData.phone}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Email:</strong> {formData.email}
              </span>
            </div>

            {formData.website && (
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Website:</strong> {formData.website}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong>Address:</strong>
                <p className="text-slate-600">
                  {formData.addressLine1}
                  {formData.addressLine2 ? `, ${formData.addressLine2}` : ''}
                  <br />
                  {formData.city}, {formData.postcode}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Coordinates: ({formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Description */}
        {formData.description ? (
          <div className="border-t border-slate-200 pt-3">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Description ({formData.description.length}/600 chars)
            </span>
            <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
              {formData.description}
            </p>
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-400 italic">
            No profile description provided (optional).
          </div>
        )}

        {/* Specialities Selected with Referral & Scope Settings */}
        <div className="border-t border-slate-200 pt-3">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Selected Services & Equipment ({formData.specialityIds.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formData.specialityIds.map((id) => {
              const spec = specialitiesMap[id];
              const offeredByVal = formData.specialityOfferedBy?.[id] || 'personal';
              const referralTypeVal = formData.specialityReferralType?.[id] || 'self_referral';
              const isPersonal = offeredByVal === 'personal';
              const isReferralOnly = referralTypeVal === 'referral_required';

              return (
                <div
                  key={id}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-1.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{spec ? spec.name : `Speciality #${id}`}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1 border-t border-slate-100">
                    {/* Provider Scope Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                        isPersonal
                          ? 'bg-teal-50 text-teal-900 border-teal-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span>{isPersonal ? '👤 Offered Myself' : '🏥 In Practice'}</span>
                    </span>

                    {/* Patient Referral Mode Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-white ${
                        isReferralOnly
                          ? 'bg-amber-700'
                          : 'bg-emerald-700'
                      }`}
                    >
                      <span>{isReferralOnly ? '📩 Referral Only' : '🚶 Self-Referral'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
