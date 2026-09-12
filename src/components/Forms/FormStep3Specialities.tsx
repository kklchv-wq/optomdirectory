'use client';

import { useEffect, useState } from 'react';
import { ListingFormValues } from '@/schemas/listing';
import { Speciality } from '@/types';
import { Stethoscope, Microchip, CheckCircle2, Plus, Sparkles, X, Loader2 } from 'lucide-react';

interface Step3Props {
  formData: ListingFormValues;
  updateFields: (fields: Partial<ListingFormValues>) => void;
  errors: Record<string, string>;
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

export default function FormStep3Specialities({
  formData,
  updateFields,
  errors,
}: Step3Props) {
  const [specialitiesList, setSpecialitiesList] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Tag Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'service' | 'equipment'>('service');
  const [customGroupSelect, setCustomGroupSelect] = useState('');
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [customGroupInput, setCustomGroupInput] = useState('');
  const [customReferralType, setCustomReferralType] = useState<'self_referral' | 'referral_required'>('self_referral');
  const [customOfferedBy, setCustomOfferedBy] = useState<'personal' | 'practice'>('personal');
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);

  const fetchSpecialities = async () => {
    try {
      const res = await fetch('/api/specialities?includePending=true');
      if (res.ok) {
        const data = await res.json();
        setSpecialitiesList(data);
      }
    } catch (err) {
      console.error('Failed to load specialities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialities();
  }, []);

  const existingGroupNames = Array.from(
    new Set(
      specialitiesList
        .map((s) => s.groupName?.trim())
        .filter((g): g is string => Boolean(g))
    )
  ).sort();

  const [openOptions, setOpenOptions] = useState<Record<number, boolean>>({});

  const toggleOptionsOpen = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSpeciality = (id: number) => {
    const currentIds = formData.specialityIds || [];
    const currentOfferedBy = formData.specialityOfferedBy || {};
    const currentReferralType = formData.specialityReferralType || {};
    if (currentIds.includes(id)) {
      const nextIds = currentIds.filter((specId) => specId !== id);
      const nextOfferedBy = { ...currentOfferedBy };
      const nextReferralType = { ...currentReferralType };
      delete nextOfferedBy[id];
      delete nextReferralType[id];
      updateFields({
        specialityIds: nextIds,
        specialityOfferedBy: nextOfferedBy,
        specialityReferralType: nextReferralType,
      });
      setOpenOptions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      updateFields({
        specialityIds: [...currentIds, id],
        specialityOfferedBy: {
          ...currentOfferedBy,
          [id]: currentOfferedBy[id] || 'personal',
        },
        specialityReferralType: {
          ...currentReferralType,
          [id]: currentReferralType[id] || 'self_referral',
        },
      });
    }
  };

  const setOfferedBy = (id: number, value: 'personal' | 'practice') => {
    const currentOfferedBy = formData.specialityOfferedBy || {};
    updateFields({
      specialityOfferedBy: {
        ...currentOfferedBy,
        [id]: value,
      },
    });
  };

  const setReferralType = (id: number, value: 'referral_required' | 'self_referral') => {
    const currentReferralType = formData.specialityReferralType || {};
    updateFields({
      specialityReferralType: {
        ...currentReferralType,
        [id]: value,
      },
    });
  };

  const handleAddCustomTag = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setCustomError(null);
    setCustomSuccess(null);

    if (!customName.trim()) {
      setCustomError('Please enter a specialty or equipment name.');
      return;
    }

    const finalGroup = isCustomGroup
      ? customGroupInput.trim()
      : (customGroupSelect || existingGroupNames[0] || 'Custom Submissions').trim();

    setCustomSubmitting(true);
    try {
      const res = await fetch('/api/specialities/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName.trim(),
          category: customCategory,
          groupName: finalGroup,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setCustomError(data.error || 'Failed to add custom tag.');
        return;
      }

      const tag: Speciality = data.tag;

      // Select this tag immediately
      const currentIds = formData.specialityIds || [];
      const currentOfferedBy = formData.specialityOfferedBy || {};
      const currentReferralType = formData.specialityReferralType || {};

      if (!currentIds.includes(tag.id)) {
        updateFields({
          specialityIds: [...currentIds, tag.id],
          specialityOfferedBy: {
            ...currentOfferedBy,
            [tag.id]: customOfferedBy,
          },
          specialityReferralType: {
            ...currentReferralType,
            [tag.id]: customReferralType,
          },
        });
      }

      setCustomSuccess(data.message || `Added "${tag.name}"!`);
      setCustomName('');
      setShowCustomModal(false);
      fetchSpecialities();
    } catch {
      setCustomError('Failed to add custom tag due to network error.');
    } finally {
      setCustomSubmitting(false);
    }
  };

  const services = specialitiesList.filter((s) => s.category === 'service' || !s.category);
  const equipment = specialitiesList.filter((s) => s.category === 'equipment');

  const serviceGroups = groupBySubGroup(services);
  const equipmentGroups = groupBySubGroup(equipment);

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        Loading clinical services and equipment taxonomy...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Step 3: Select Clinical Services & Specialized Equipment
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Select procedures offered and diagnostic equipment available for your listing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>+ Add Custom Tag</span>
        </button>
      </div>

      <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 text-xs text-teal-950 flex items-start gap-2.5">
        <span className="text-base shrink-0 mt-0.5">💡</span>
        <div>
          <strong className="font-bold">Simple Tag Selection:</strong>
          <p className="mt-0.5 text-[11px] text-teal-900 leading-relaxed">
            Simply check the services and equipment you offer. Specifying referral access (<strong>Self-Referral</strong> vs <strong>Referral Only</strong>) is completely <strong>optional</strong> — click <strong>&quot;⚙️ Options&quot;</strong> on any tag if you wish to customize referral settings or provider scope.
          </p>
        </div>
      </div>

      {customSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs font-semibold rounded-xl border border-emerald-300">
          🎉 {customSuccess}
        </div>
      )}

      {errors.specialityIds && (
        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {errors.specialityIds}
        </div>
      )}

      {/* CUSTOM TAG CREATOR FORM / CARD */}
      {showCustomModal && (
        <div className="bg-white p-5 rounded-2xl border-2 border-teal-400 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Add Custom Specialty or Equipment Tag</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {customError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
              {customError}
            </div>
          )}

          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomTag(e);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Optovue OCT-Angiography"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as 'service' | 'equipment')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium"
                >
                  <option value="service">🩺 Clinical Service</option>
                  <option value="equipment">🔬 Diagnostic Equipment</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">Sub-Header Group</label>
                <select
                  value={isCustomGroup ? '__NEW_GROUP__' : (customGroupSelect || existingGroupNames[0] || '')}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_GROUP__') {
                      setIsCustomGroup(true);
                    } else {
                      setIsCustomGroup(false);
                      setCustomGroupSelect(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium"
                >
                  <optgroup label="Select Existing Group">
                    {existingGroupNames.map((grp) => (
                      <option key={grp} value={grp}>
                        📁 {grp}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__NEW_GROUP__">✨ + New Group Name...</option>
                </select>

                {isCustomGroup && (
                  <input
                    type="text"
                    required
                    value={customGroupInput}
                    onChange={(e) => setCustomGroupInput(e.target.value)}
                    placeholder="Type new group name..."
                    className="mt-2 w-full px-3 py-2 bg-white border border-teal-500 rounded-xl text-sm"
                  />
                )}
              </div>
            </div>

            {/* Custom Tag Options: Patient Access & Provider Scope (Optional) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Optional Referral & Scope Settings
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Patient Access:</span>
                  <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                    <button
                      type="button"
                      onClick={() => setCustomReferralType('self_referral')}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        customReferralType === 'self_referral'
                          ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      🚶 Self-Referral
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomReferralType('referral_required')}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        customReferralType === 'referral_required'
                          ? 'bg-amber-700 text-white font-bold shadow-2xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      📩 Referral Only
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Provider Scope:</span>
                  <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                    <button
                      type="button"
                      onClick={() => setCustomOfferedBy('personal')}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        customOfferedBy === 'personal'
                          ? 'bg-teal-700 text-white font-bold shadow-2xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      👤 Offered Myself
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomOfferedBy('practice')}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        customOfferedBy === 'practice'
                          ? 'bg-slate-700 text-white font-bold shadow-2xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      🏥 In Practice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={customSubmitting}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                {customSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Tag & Attach</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Clinical Services & Procedures */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-teal-950 flex items-center gap-1.5 uppercase tracking-wider">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <span>1. Clinical Services & Procedures</span>
        </h3>

        <div className="space-y-4 pl-3 border-l-2 border-teal-200">
          {Object.entries(serviceGroups).map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wide block">
                {groupName}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupItems.map((spec) => {
                  const isChecked = formData.specialityIds?.includes(spec.id);
                  const isOptionsOpen = !!openOptions[spec.id];
                  const hasCustomReferral = formData.specialityReferralType?.[spec.id] === 'referral_required';
                  const offeredByVal = formData.specialityOfferedBy?.[spec.id] || 'personal';
                  const referralTypeVal = formData.specialityReferralType?.[spec.id] || 'self_referral';
                  return (
                    <div
                      key={spec.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                        isChecked
                          ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 select-none">
                        <label className="cursor-pointer flex items-start gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            value={spec.id}
                            checked={isChecked}
                            onChange={() => toggleSpeciality(spec.id)}
                            className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{spec.name}</span>
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                              {hasCustomReferral && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                  📩 Referral Only
                                </span>
                              )}
                              {spec.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                  ⏳ Pending
                                </span>
                              )}
                              {spec.description && (
                                <span
                                  title={spec.description}
                                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold cursor-help hover:bg-teal-600 hover:text-white transition-colors shrink-0"
                                >
                                  i
                                </span>
                              )}
                            </span>
                          </div>
                        </label>

                        {/* Optional options toggle button */}
                        {isChecked && (
                          <button
                            type="button"
                            onClick={(e) => toggleOptionsOpen(spec.id, e)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                              isOptionsOpen || hasCustomReferral
                                ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                                : 'bg-teal-100/70 hover:bg-teal-200 text-teal-900 border-teal-300'
                            }`}
                          >
                            ⚙️ Options
                          </button>
                        )}
                      </div>

                      {/* Optional Expandable Options Toolbar when requested */}
                      {isChecked && isOptionsOpen && (
                        <div className="pt-2 border-t border-teal-200/60 space-y-2 text-[11px] bg-white/70 p-2 rounded-lg mt-1">
                          {/* 1. Provider Scope */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Provider Scope:</span>
                            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                              <button
                                type="button"
                                onClick={() => setOfferedBy(spec.id, 'personal')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  offeredByVal === 'personal'
                                    ? 'bg-teal-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                👤 Offered Myself
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfferedBy(spec.id, 'practice')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  offeredByVal === 'practice'
                                    ? 'bg-slate-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                🏥 In Practice
                              </button>
                            </div>
                          </div>

                          {/* 2. Patient Access / Referral Mode */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Patient Access:</span>
                            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                              <button
                                type="button"
                                onClick={() => setReferralType(spec.id, 'self_referral')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  referralTypeVal === 'self_referral'
                                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                🚶 Self-Referral
                              </button>
                              <button
                                type="button"
                                onClick={() => setReferralType(spec.id, 'referral_required')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  referralTypeVal === 'referral_required'
                                    ? 'bg-amber-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                📩 Referral Only
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Specialized Diagnostic Equipment */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
          <Microchip className="w-4 h-4 text-indigo-600" />
          <span>2. Specialized Diagnostic Equipment Available</span>
        </h3>

        <div className="space-y-4 pl-3 border-l-2 border-indigo-200">
          {Object.entries(equipmentGroups).map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block">
                {groupName}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupItems.map((item) => {
                  const isChecked = formData.specialityIds?.includes(item.id);
                  const isOptionsOpen = !!openOptions[item.id];
                  const hasCustomReferral = formData.specialityReferralType?.[item.id] === 'referral_required';
                  const offeredByVal = formData.specialityOfferedBy?.[item.id] || 'practice';
                  const referralTypeVal = formData.specialityReferralType?.[item.id] || 'self_referral';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 select-none">
                        <label className="cursor-pointer flex items-start gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            value={item.id}
                            checked={isChecked}
                            onChange={() => toggleSpeciality(item.id)}
                            className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              {hasCustomReferral && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                  📩 Referral Only
                                </span>
                              )}
                              {item.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                  ⏳ Pending
                                </span>
                              )}
                              {item.description && (
                                <span
                                  title={item.description}
                                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold cursor-help hover:bg-indigo-600 hover:text-white transition-colors shrink-0"
                                >
                                  i
                                </span>
                              )}
                            </span>
                          </div>
                        </label>

                        {/* Optional options toggle button */}
                        {isChecked && (
                          <button
                            type="button"
                            onClick={(e) => toggleOptionsOpen(item.id, e)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                              isOptionsOpen || hasCustomReferral
                                ? 'bg-indigo-700 text-white border-indigo-800 shadow-2xs'
                                : 'bg-indigo-100/70 hover:bg-indigo-200 text-indigo-900 border-indigo-300'
                            }`}
                          >
                            ⚙️ Options
                          </button>
                        )}
                      </div>

                      {/* Optional Expandable Options Toolbar when requested */}
                      {isChecked && isOptionsOpen && (
                        <div className="pt-2 border-t border-indigo-200/60 space-y-2 text-[11px] bg-white/70 p-2 rounded-lg mt-1">
                          {/* 1. Provider Scope */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Provider Scope:</span>
                            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                              <button
                                type="button"
                                onClick={() => setOfferedBy(item.id, 'personal')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  offeredByVal === 'personal'
                                    ? 'bg-indigo-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                👤 Offered Myself
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfferedBy(item.id, 'practice')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  offeredByVal === 'practice'
                                    ? 'bg-slate-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                🏥 In Practice
                              </button>
                            </div>
                          </div>

                          {/* 2. Patient Access / Referral Mode */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Patient Access:</span>
                            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 font-medium">
                              <button
                                type="button"
                                onClick={() => setReferralType(item.id, 'self_referral')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  referralTypeVal === 'self_referral'
                                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                🚶 Self-Referral
                              </button>
                              <button
                                type="button"
                                onClick={() => setReferralType(item.id, 'referral_required')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  referralTypeVal === 'referral_required'
                                    ? 'bg-amber-700 text-white font-bold shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                📩 Referral Only
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
