'use client';

import { useState } from 'react';
import { Printer, Mail, Copy, Check, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PracticeListing, Speciality } from '@/types';

interface ShareProps {
  practice: PracticeListing & { specialities: Speciality[] };
}

export default function ShareReferralToolbar({ practice }: ShareProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailTextCopied, setEmailTextCopied] = useState(false);
  
  // Email sending state
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const emailSubject = encodeURIComponent(
    `Optometry Practice Details: ${practice.practiceName} (${practice.contactName})`
  );

  const emailBodyText = `Hello,

Here are the practitioner details for ${practice.practiceName} (${practice.contactName}):

👨‍⚕️ Optometrist: ${practice.contactName} (GOC: ${practice.gocNumber})
🏥 Practice: ${practice.practiceName}
📍 Address: ${practice.addressLine1}, ${practice.city} (${practice.postcode})
📞 Phone: ${practice.phone}
✉️ Email: ${practice.email}
${practice.website ? `🌐 Website: ${practice.website}\n` : ''}
Registered Services & Diagnostic Equipment:
${practice.specialities.map((s) => `• ${s.name} (${s.referralType === 'referral_required' ? 'Referral Required' : 'Self-Referral Allowed'})`).join('\n')}

View full profile online:
${typeof window !== 'undefined' ? window.location.href : ''}
`;

  const handleCopyEmailText = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(emailBodyText);
      setEmailTextCopied(true);
      setTimeout(() => setEmailTextCopied(false), 2500);
    }
  };

  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${emailSubject}&body=${encodeURIComponent(emailBodyText)}`;

  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientEmail || !patientEmail.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/share/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail,
          practiceName: practice.practiceName,
          contactName: practice.contactName,
          gocNumber: practice.gocNumber,
          phone: practice.phone,
          email: practice.email,
          website: practice.website,
          specialities: practice.specialities,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email.');
      }

      setStatusMsg({ type: 'success', text: `Email sent successfully to ${patientEmail}!` });
      setTimeout(() => {
        setShowEmailModal(false);
        setPatientEmail('');
        setStatusMsg(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending email';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="print:hidden flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
          title="Print practitioner details as displayed on page"
        >
          <Printer className="w-4 h-4 text-teal-700" />
          <span>Print Details</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEmailModal(true);
            setStatusMsg(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
          title="Email details to patient"
        >
          <Mail className="w-4 h-4 text-teal-700" />
          <span>Email Patient</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
          title="Copy direct URL link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-extrabold">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="print:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Email Details to Patient</h3>
                  <p className="text-[11px] text-slate-500">Send practitioner information directly to your patient</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendDirectEmail} className="space-y-4 text-xs">
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2 text-xs font-semibold ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Patient's Email Address:
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Included Practitioner Details:</span>
                <p className="text-[11px]"><strong>Practitioner:</strong> {practice.contactName} ({practice.practiceName})</p>
                <p className="text-[11px]"><strong>Phone:</strong> {practice.phone}</p>
                <p className="text-[11px]"><strong>Address:</strong> {practice.addressLine1}, {practice.city} ({practice.postcode})</p>
                <p className="text-[11px]"><strong>Services:</strong> {practice.specialities.length} items listed</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Email directly to Patient</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  <a
                    href={mailtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowEmailModal(false)}
                    className="text-slate-600 hover:text-teal-700 underline font-medium"
                  >
                    Open in Local Mail App
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmailText}
                    className="text-slate-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    {emailTextCopied ? 'Text Copied!' : 'Copy Email Text'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
