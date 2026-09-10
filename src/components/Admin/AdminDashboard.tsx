'use client';

import { useState, useEffect } from 'react';
import { PracticeListing, Speciality } from '@/types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Loader2,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Stethoscope,
  Microchip,
  Download,
  Database,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboard() {
  const [password, setPassword] = useState('admin123');
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('admin123');
  const [authError, setAuthError] = useState<string | null>(null);

  // Main Section Tab: 'listings' | 'tags' | 'backup'
  const [mainSection, setMainSection] = useState<'listings' | 'tags' | 'backup'>('listings');

  // Backup & Map Sync State
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Listings Queue State
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [listings, setListings] = useState<PracticeListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Taxonomy Tags State
  const [specialitiesList, setSpecialitiesList] = useState<Speciality[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);

  // Derived unique pre-existing group names
  const existingGroupNames = Array.from(
    new Set(
      specialitiesList
        .map((s) => s.groupName?.trim())
        .filter((g): g is string => Boolean(g))
    )
  ).sort();

  // New Tag Form State
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<'service' | 'equipment'>('service');
  const [newTagGroupSelect, setNewTagGroupSelect] = useState('');
  const [isCustomNewGroup, setIsCustomNewGroup] = useState(false);
  const [newTagCustomGroup, setNewTagCustomGroup] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagSuccess, setTagSuccess] = useState<string | null>(null);

  // Edit Tag Form State
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'service' | 'equipment'>('service');
  const [editGroupSelect, setEditGroupSelect] = useState('');
  const [isCustomEditGroup, setIsCustomEditGroup] = useState(false);
  const [editCustomGroup, setEditCustomGroup] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchAdminListings = async (passToUse?: string) => {
    const activePass = passToUse || password || 'admin123';
    setLoadingListings(true);
    setAuthError(null);

    try {
      const res = await fetch(`/api/admin/listings?status=${activeTab}`, {
        headers: { 'x-admin-password': activePass },
      });

      if (res.status === 401) {
        setAuthError('Incorrect admin password.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchSpecialities = async () => {
    setLoadingTags(true);
    try {
      const res = await fetch('/api/specialities?includePending=true');
      if (res.ok) {
        const data = await res.json();
        setSpecialitiesList(data);
      }
    } catch (err) {
      console.error('Failed to fetch specialities:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleApproveCustomTag = async (id: number) => {
    try {
      const res = await fetch('/api/admin/specialities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      if (res.ok) {
        fetchSpecialities();
      }
    } catch (err) {
      console.error('Failed to approve tag:', err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = adminPasswordInput.trim() || 'admin123';
    setPassword(pass);
    setAuthenticated(true);
    document.cookie = `admin_session=authenticated; path=/; max-age=86400`;
    fetchAdminListings(pass);
    fetchSpecialities();
  };

  useEffect(() => {
    if (authenticated) {
      if (mainSection === 'listings') {
        fetchAdminListings();
      } else {
        fetchSpecialities();
      }
    }
  }, [authenticated, activeTab, mainSection]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || 'admin123',
        },
        body: JSON.stringify({ listingId: id }),
      });

      if (res.ok) {
        fetchAdminListings();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || 'admin123',
        },
        body: JSON.stringify({ listingId: id, rejectionReason }),
      });

      if (res.ok) {
        setRejectingId(null);
        setRejectionReason('');
        fetchAdminListings();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Add New Tag Handler
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagError(null);
    setTagSuccess(null);

    if (!newTagName.trim()) {
      setTagError('Please enter a tag name.');
      return;
    }

    const finalGroup = isCustomNewGroup
      ? newTagCustomGroup.trim()
      : (newTagGroupSelect || existingGroupNames[0] || 'General').trim();

    if (!finalGroup) {
      setTagError('Please specify or select a Sub-Header Group Name.');
      return;
    }

    try {
      const res = await fetch('/api/admin/specialities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          category: newTagCategory,
          groupName: finalGroup,
          description: newTagDesc.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setTagError(data.error || 'Failed to create tag.');
        return;
      }

      setTagSuccess(`Added tag "${newTagName}" under group "${finalGroup}" successfully!`);
      setNewTagName('');
      setNewTagDesc('');
      if (isCustomNewGroup) {
        setIsCustomNewGroup(false);
        setNewTagCustomGroup('');
      }
      fetchSpecialities();
    } catch {
      setTagError('Failed to create tag due to network error.');
    }
  };

  // Edit Tag Start
  const startEditingTag = (tag: Speciality) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditCategory(tag.category || 'service');
    const grp = tag.groupName?.trim() || 'General';
    if (existingGroupNames.includes(grp)) {
      setEditGroupSelect(grp);
      setIsCustomEditGroup(false);
      setEditCustomGroup('');
    } else {
      setEditGroupSelect('__NEW_GROUP__');
      setIsCustomEditGroup(true);
      setEditCustomGroup(grp);
    }
    setEditDesc(tag.description || '');
  };

  // Save Edited Tag
  const handleSaveEditTag = async (id: number) => {
    const finalGroup = isCustomEditGroup
      ? editCustomGroup.trim()
      : (editGroupSelect || existingGroupNames[0] || 'General').trim();

    try {
      const res = await fetch('/api/admin/specialities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          category: editCategory,
          groupName: finalGroup,
          description: editDesc.trim() || undefined,
        }),
      });

      if (res.ok) {
        setEditingTagId(null);
        fetchSpecialities();
      }
    } catch (err) {
      console.error('Failed to update tag:', err);
    }
  };

  // Delete Tag
  const handleDeleteTag = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/specialities?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSpecialities();
      }
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
  };

  // Login Prompt View
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Admin Area Authentication</h2>
          <p className="text-xs text-slate-600">
            Enter administrator password (default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">admin123</code>).
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="adminPassword" className="block text-xs font-semibold text-slate-700">
              Admin Password
            </label>
            <input
              id="adminPassword"
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              placeholder="admin123"
              className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Access Admin Area →
          </button>
        </form>
      </div>
    );
  }
  const handleTriggerSnapshot = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || 'admin123',
        },
        body: JSON.stringify({ action: 'snapshot' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setBackupError(data.error || 'Failed to create database snapshot.');
        return;
      }
      setBackupMsg(data.message || 'Database snapshot created successfully.');
    } catch (err) {
      setBackupError('Failed to execute database backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleTriggerRegeocode = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || 'admin123',
        },
        body: JSON.stringify({ action: 'regeocode' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setBackupError(data.error || 'Failed to sync map coordinates.');
        return;
      }
      setBackupMsg(data.message || 'Map coordinates re-geocoded successfully.');
      fetchAdminListings();
    } catch (err) {
      setBackupError('Failed to execute map re-geocoding.');
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Navigation & Main Section Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Admin Management Portal</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage practice listing approvals, directory taxonomy tags, and database backups & map sync.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAuthenticated(false)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Lock Admin Session
        </button>
      </div>

      {/* Main Section Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setMainSection('listings')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            mainSection === 'listings'
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          📋 Practice Approvals Queue
        </button>

        <button
          type="button"
          onClick={() => setMainSection('tags')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
            mainSection === 'tags'
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Manage Tag Taxonomy ({specialitiesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('backup')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
            mainSection === 'backup'
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Map Sync</span>
        </button>
      </div>

      {/* SECTION 1: LISTINGS APPROVAL QUEUE */}
      {mainSection === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loadingListings ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Loading listing submissions...</span>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No listings found for filter status "{activeTab}".
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {item.contactName}
                        </h3>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                          GOC: {item.gocNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Practice: {item.practiceName}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                        item.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.addressLine1}, {item.city} ({item.postcode})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.email}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {item.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoading === item.id}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>
                    )}

                    {item.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => setRejectingId(item.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SELF-SERVICE TAG & TAXONOMY MANAGER */}
      {mainSection === 'tags' && (
        <div className="space-y-6">
          {/* Add New Tag Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Add New Specialty or Equipment Tag</span>
            </h2>

            {tagError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {tagError}
              </div>
            )}

            {tagSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold">
                {tagSuccess}
              </div>
            )}

            <form onSubmit={handleAddTag} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Rexon-Eye Therapy"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value as 'service' | 'equipment')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="service">🩺 Clinical Service</option>
                  <option value="equipment">🔬 Diagnostic Equipment</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 mb-1">
                  Sub-Header Group Name
                </label>
                <select
                  value={isCustomNewGroup ? '__NEW_GROUP__' : (newTagGroupSelect || existingGroupNames[0] || '')}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_GROUP__') {
                      setIsCustomNewGroup(true);
                    } else {
                      setIsCustomNewGroup(false);
                      setNewTagGroupSelect(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <optgroup label="Select Pre-existing Group">
                    {existingGroupNames.map((grp) => (
                      <option key={grp} value={grp}>
                        📁 {grp}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__NEW_GROUP__">✨ + Create New Group Header...</option>
                </select>

                {isCustomNewGroup && (
                  <input
                    type="text"
                    required
                    value={newTagCustomGroup}
                    onChange={(e) => setNewTagCustomGroup(e.target.value)}
                    placeholder="Type new group name..."
                    className="mt-2 w-full px-3 py-2 bg-white border border-teal-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                )}
              </div>

              <div className="sm:col-span-10">
                <label className="block font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newTagDesc}
                  onChange={(e) => setNewTagDesc(e.target.value)}
                  placeholder="Brief description for info tooltip ⓘ"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </form>
          </div>

          {/* Pending Custom Tag Requests */}
          {specialitiesList.some((t) => t.status === 'pending') && (
            <div className="bg-amber-50/90 p-5 rounded-2xl border border-amber-300 shadow-2xs space-y-3">
              <h2 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <span>⏳ Pending Custom Tag Requests</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px]">
                  {specialitiesList.filter((t) => t.status === 'pending').length}
                </span>
              </h2>

              <div className="space-y-2">
                {specialitiesList
                  .filter((t) => t.status === 'pending')
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span>{tag.category === 'equipment' ? '🔬' : '🩺'}</span>
                        <div>
                          <span className="font-extrabold text-slate-900 block truncate">
                            {tag.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            Group: {tag.groupName || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveCustomTag(tag.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Tag</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Reject / Delete Tag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Specialities List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Approved Directory Tags ({specialitiesList.filter((t) => t.status !== 'pending').length})
            </h2>

            {loadingTags ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading taxonomy tags...
              </div>
            ) : (
              <div className="space-y-3">
                {specialitiesList.map((tag) => {
                  const isEditing = editingTagId === tag.id;

                  if (isEditing) {
                    return (
                      <div
                        key={tag.id}
                        className="p-3 bg-teal-50 border border-teal-300 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs"
                      >
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-teal-400 rounded-lg font-bold"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as 'service' | 'equipment')}
                            className="w-full px-2 py-1 bg-white border border-teal-400 rounded-lg"
                          >
                            <option value="service">Service</option>
                            <option value="equipment">Equipment</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={isCustomEditGroup ? '__NEW_GROUP__' : (editGroupSelect || existingGroupNames[0] || '')}
                            onChange={(e) => {
                              if (e.target.value === '__NEW_GROUP__') {
                                setIsCustomEditGroup(true);
                              } else {
                                setIsCustomEditGroup(false);
                                setEditGroupSelect(e.target.value);
                              }
                            }}
                            className="w-full px-2 py-1 bg-white border border-teal-400 rounded-lg text-xs"
                          >
                            <optgroup label="Existing Groups">
                              {existingGroupNames.map((grp) => (
                                <option key={grp} value={grp}>
                                  {grp}
                                </option>
                              ))}
                            </optgroup>
                            <option value="__NEW_GROUP__">✨ + New Group...</option>
                          </select>
                          {isCustomEditGroup && (
                            <input
                              type="text"
                              required
                              value={editCustomGroup}
                              onChange={(e) => setEditCustomGroup(e.target.value)}
                              placeholder="New group name..."
                              className="mt-1 w-full px-2 py-1 bg-white border border-teal-500 rounded-lg text-xs"
                            />
                          )}
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveEditTag(tag.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTagId(null)}
                            className="p-1.5 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tag.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span>{tag.category === 'equipment' ? '🔬' : '🩺'}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {tag.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Group: {tag.groupName || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditingTag(tag)}
                          className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Tag"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Tag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: DATABASE BACKUP & MAP SYNCHRONIZATION */}
      {mainSection === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <span>Directory Database Backup & Map Synchronization Center</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Export practitioner listings for manual review or spreadsheet backup, create physical database snapshots, or force-sync map pin coordinates across all UK postcodes.
            </p>
          </div>

          {backupMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          {backupError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{backupError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: CSV Export */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm">
                <FileSpreadsheet className="w-5 h-5 text-teal-700" />
                <span>Export Practitioner Listings (CSV)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a complete, structured CSV spreadsheet containing all registered optometrists, practice addresses, telephone numbers, emails, and attached clinical specialities for offline backup or manual editing.
              </p>
              <a
                href={`/api/admin/backup?type=csv&password=${encodeURIComponent(password || 'admin123')}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Practitioner CSV Backup</span>
              </a>
            </div>

            {/* Card 2: JSON Full Backup */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                <Database className="w-5 h-5 text-indigo-700" />
                <span>Full Directory Database Export (JSON)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export a full JSON backup file containing all database tables including registered practitioner user accounts, listings, alert subscriptions, and contact messages.
              </p>
              <a
                href={`/api/admin/backup?type=json&password=${encodeURIComponent(password || 'admin123')}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Database JSON Backup</span>
              </a>
            </div>

            {/* Card 3: Database Snapshot */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <span>Create Physical Database Snapshot (.db)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Creates a timestamped snapshot of the live SQLite database file in the server <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">backups/</code> folder for emergency rollback.
              </p>
              <button
                type="button"
                onClick={handleTriggerSnapshot}
                disabled={backupLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {backupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Save Local Snapshot (.db)</span>
              </button>
            </div>

            {/* Card 4: Map Coordinates Synchronization */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm">
                <RefreshCw className="w-5 h-5 text-teal-700" />
                <span>Sync Map Coordinates & Re-Geocode</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Batch verifies UK postcodes across all listings, updates latitude and longitude coordinates, and ensures 100% of practices display accurately on the interactive map.
              </p>
              <button
                type="button"
                onClick={handleTriggerRegeocode}
                disabled={backupLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {backupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Re-Geocode & Sync Map Coordinates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
