'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/UI/Header';
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Optometry Practitioner Network</span>
            </div>

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

            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Response SLA: Within 24 hours</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Contact Information & Support Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Contact Information
                </h3>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Support Email</span>
                      <a href="mailto:support@optomdirectory.co.uk" className="font-bold text-teal-800 hover:underline text-sm">
                        support@optomdirectory.co.uk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Coverage Area</span>
                      <p className="font-semibold text-slate-900">UK Nationwide (England, Scotland, Wales, N. Ireland)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">GOC Registration Enquiries</span>
                      <p className="font-semibold text-slate-900">Verified GOC Optometrist Register Support</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Practitioner Callout Box */}
              <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 rounded-2xl space-y-3">
                <h4 className="text-sm font-extrabold flex items-center gap-2 text-teal-300">
                  <User className="w-4 h-4" />
                  <span>Are you an Optometrist?</span>
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Join the UK directory to list your specialities, clinical services, diagnostic equipment, and accept direct referrals.
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                  >
                    <span>Join the Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all border border-white/20"
                  >
                    <span>Login to Portal</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-7">
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
            <Eye className="w-5 h-5 text-teal-400" />
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
