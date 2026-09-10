'use client';

import { ListingFormValues } from '@/schemas/listing';

interface Step1Props {
  formData: ListingFormValues;
  updateFields: (fields: Partial<ListingFormValues>) => void;
  errors: Record<string, string>;
}

export default function FormStep1Details({
  formData,
  updateFields,
  errors,
}: Step1Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
        Step 1: Practice & Practitioner Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Practice Name */}
        <div>
          <label htmlFor="practiceName" className="block text-xs font-semibold text-slate-700">
            Practice Name <span className="text-red-500">*</span>
          </label>
          <input
            id="practiceName"
            type="text"
            value={formData.practiceName}
            onChange={(e) => updateFields({ practiceName: e.target.value })}
            placeholder="e.g. Union Street Eye Clinic"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.practiceName && (
            <p className="mt-1 text-xs text-red-600">{errors.practiceName}</p>
          )}
        </div>

        {/* Lead Contact Name */}
        <div>
          <label htmlFor="contactName" className="block text-xs font-semibold text-slate-700">
            Lead Optometrist / Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contactName"
            type="text"
            value={formData.contactName}
            onChange={(e) => updateFields({ contactName: e.target.value })}
            placeholder="e.g. Dr. Fiona McTavish"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.contactName && (
            <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GOC Number */}
        <div>
          <label htmlFor="gocNumber" className="block text-xs font-semibold text-slate-700">
            GOC Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            id="gocNumber"
            type="text"
            value={formData.gocNumber}
            onChange={(e) => updateFields({ gocNumber: e.target.value.trim() })}
            placeholder="e.g. 01-12345 or 12345"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Required for verified practitioner listings in the UK.
          </span>
          {errors.gocNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.gocNumber}</p>
          )}
        </div>

        {/* Telephone */}
        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
            Practice Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFields({ phone: e.target.value })}
            placeholder="e.g. 01224 600000"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
            Referral Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFields({ email: e.target.value })}
            placeholder="e.g. referrals@practice.co.uk"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Your secret edit link will also be sent to this email.
          </span>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-xs font-semibold text-slate-700">
            Website URL <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            id="website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => updateFields({ website: e.target.value })}
            placeholder="e.g. https://www.practice.co.uk"
            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {errors.website && (
            <p className="mt-1 text-xs text-red-600">{errors.website}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="description" className="block text-xs font-semibold text-slate-700">
            Practice Profile & Special Equipment Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <span
            className={`text-xs ${
              (formData.description?.length || 0) > 600
                ? 'text-red-600 font-bold'
                : 'text-slate-500'
            }`}
          >
            {(formData.description?.length || 0)}/600 chars
          </span>
        </div>
        <textarea
          id="description"
          rows={4}
          maxLength={600}
          value={formData.description}
          onChange={(e) => updateFields({ description: e.target.value })}
          placeholder="Describe your clinic's specialized equipment (e.g. Optomap, OCT, Colorimeter), clinical focus areas, referral procedures, and appointment availability."
          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
