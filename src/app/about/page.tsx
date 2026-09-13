'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/UI/Header';
import OptomLogo from '@/components/UI/OptomLogo';
import { trackEvent } from '@/lib/gtag';
import {
  Eye,
  ShieldCheck,
  Stethoscope,
  Microscope,
  FileText,
  Mail,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  HelpCircle,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react';

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'optometrist',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to submit contact message.');
        return;
      }

      setSuccessMsg(data.message || 'Thank you! Your message has been sent successfully.');
      trackEvent({
        action: 'contact_form_submit',
        category: 'contact',
        label: formData.role,
      });
      setFormData({
        name: '',
        email: '',
        role: 'optometrist',
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('Contact form submit error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-800/40">
          <div className="relative z-10 max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Connect with Optometrists Across the UK
            </h1>

            <p className="text-teal-50 text-base sm:text-lg leading-relaxed font-medium">
              Optom Directory is meant to help you connect to other optometrists who offer what you're looking for. If there is something you like getting involved with, add it to your profile—make it easier for others to find you and help you see more of the things that enhance your day.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-teal-100">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Connect with Colleagues</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Customise Offered Services</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Self & Professional Referrals</span>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Why Optom Directory?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Built to make practitioner discovery seamless and elevate the clinical work you love doing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Find Specialist Expertise</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quickly locate optometrists with specific clinical interests, Independent Prescribing (IP), dry eye clinics, or specialist contact lens skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Add What You Enjoy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Highlight the clinical services and equipment you enjoy providing so nearby colleagues and patients can easily direct queries to you.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Instant Live Profile Updates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Update the services and equipment you offer at any time without administrative delays or waiting for manual re-approval.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT US SECTION */}
        <section id="contact" className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-100 pb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-extrabold text-xs uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                <span>Get In Touch</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Contact Us
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Have a question about the directory, need support with your practitioner listing, or want to suggest a new clinical speciality tag? Send us a message below.
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Interactive Contact Form */}
            <div>
              {successMsg ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Message Sent Successfully!</h3>
                  <p className="text-xs text-slate-600">{successMsg}</p>
                  <button
                    type="button"
                    onClick={() => setSuccessMsg(null)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. sarah@example.co.uk"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        I am a: <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold"
                      >
                        <option value="optometrist">🩺 Registered Optometrist</option>
                        <option value="patient">🚶 Patient / Member of Public</option>
                        <option value="practice_manager">🏥 Optical Practice Owner / Manager</option>
                        <option value="other">💬 Other Enquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Speciality tag request / Listing support"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message here..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <OptomLogo className="h-6 w-auto text-teal-400" />
            <span className="font-bold text-white text-sm">Optom Directory UK</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Directory Search</Link>
            <Link href="/about" className="hover:text-white transition-colors">About & Contact</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Join Directory</Link>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Optom Directory UK • Clinical Optometry Referral Network
          </p>
        </div>
      </footer>
    </div>
  );
}
