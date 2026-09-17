'use client';

import { useEffect, useState } from 'react';
import { ListingFormValues } from '@/schemas/listing';
import { Speciality } from '@/types';
import { Stethoscope, Microchip, CheckCircle2, Plus, Sparkles, X, Loader2, Search } from 'lucide-react';

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
  const [stepSearch, setStepSearch] = useState('');
  const [stepTab, setStepTab] = useState<'all' | 'service' | 'equipment' | 'selected'>('all');

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
    } else {
      updateFields({
        specialityIds: [...currentIds, id],
      });
    }
  };

  const setOfferedBy = (id: number, value: 'personal' | 'practice') => {
    const currentOfferedBy = formData.specialityOfferedBy || {};
    const nextOfferedBy = { ...currentOfferedBy };
    if (currentOfferedBy[id] === value) {
      delete nextOfferedBy[id];
    } else {
      nextOfferedBy[id] = value;
    }
    updateFields({
      specialityOfferedBy: nextOfferedBy,
    });
  };

  const setReferralType = (id: number, value: 'referral_required' | 'self_referral') => {
    const currentReferralType = formData.specialityReferralType || {};
    const nextReferralType = { ...currentReferralType };
    if (currentReferralType[id] === value) {
      delete nextReferralType[id];
    } else {
      nextReferralType[id] = value;
    }
    updateFields({
      specialityReferralType: nextReferralType,
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

  const filteredSpecialities = specialitiesList.filter((s) => {
    if (stepTab === 'service' && s.category === 'equipment') return false;
    if (stepTab === 'equipment' && (s.category || 'service') !== 'equipment') return false;
    if (stepTab === 'selected' && !formData.specialityIds?.includes(s.id)) return false;
    if (!stepSearch.trim()) return true;
    const q = stepSearch.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.groupName && s.groupName.toLowerCase().includes(q))
    );
  });

  const services = filteredSpecialities.filter((s) => s.category === 'service' || !s.category);
  const equipment = filteredSpecialities.filter((s) => s.category === 'equipment');

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Step 3: Select Clinical Services & Specialized Equipment
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Select what you're interested in and what you like doing. Help build the clinic that makes your day fulfilling. You can also select things in store you think would be helpful for us to have on the directory but you don't offer yourself as well!
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
            Select any service or equipment item below to add it to your profile. Provider scope and referral buttons appear directly on checked items — configuring them is completely <strong>optional</strong>. Unselected options will display as clean service tags on your profile without any unselected badges.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2.5 bg-slate-100/90 p-2.5 rounded-xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filter View:</span>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => setStepTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stepTab === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All ({specialitiesList.length})
          </button>
          <button
            type="button"
            onClick={() => setStepTab('service')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stepTab === 'service'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            🩺 Services ({specialitiesList.filter((s) => s.category === 'service' || !s.category).length})
          </button>
          <button
            type="button"
            onClick={() => setStepTab('equipment')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stepTab === 'equipment'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            🔬 Equipment ({specialitiesList.filter((s) => s.category === 'equipment').length})
          </button>
          <button
            type="button"
            onClick={() => setStepTab('selected')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stepTab === 'selected'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            ✓ Selected ({formData.specialityIds?.length || 0})
          </button>
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
                Optional Referral & Provider Settings
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Access:</span>
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
                  <span className="font-semibold text-slate-700 block mb-1">Provider:</span>
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

      {/* Services & Equipment Tag Cards (Fully Expanded, No internal scroll window) */}
      <div className="space-y-6">
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
                  const offeredByVal = formData.specialityOfferedBy?.[spec.id];
                  const referralTypeVal = formData.specialityReferralType?.[spec.id];
                  return (
                    <div
                      key={spec.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                        isChecked
                          ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <label className="cursor-pointer flex items-start gap-2.5 select-none">
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
                            {spec.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                ⏳ Pending
                              </span>
                            )}
                          </span>
                        </div>
                      </label>

                      {/* Provider & Referral Options Toolbar directly visible when checked */}
                      {isChecked && (
                        <div className="pt-2 border-t border-teal-200/60 space-y-2 text-[11px] select-none">
                          {/* 1. Provider */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Provider:</span>
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

                          {/* 2. Access / Referral Mode */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Access:</span>
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
                  const offeredByVal = formData.specialityOfferedBy?.[item.id];
                  const referralTypeVal = formData.specialityReferralType?.[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <label className="cursor-pointer flex items-start gap-2.5 select-none">
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
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                                ⏳ Pending
                              </span>
                            )}
                          </span>
                        </div>
                      </label>

                      {/* Provider & Referral Options Toolbar directly visible when checked */}
                      {isChecked && (
                        <div className="pt-2 border-t border-indigo-200/60 space-y-2 text-[11px] select-none">
                          {/* 1. Provider */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Provider:</span>
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

                          {/* 2. Access / Referral Mode */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Access:</span>
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
  </div>
);
}
