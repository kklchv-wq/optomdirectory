'use client';

import { useState, useEffect } from 'react';
import { Share2, Printer, Mail, Copy, Check, X, Send } from 'lucide-react';
import { PracticeListing, Speciality } from '@/types';

interface ShareProps {
  practice: PracticeListing & { specialities: Speciality[] };
}

export default function ShareReferralToolbar({ practice }: ShareProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    setTodayDate(
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

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
    `Optometry Referral Details: ${practice.practiceName} (${practice.contactName})`
  );

  const emailBodyText = `Hello,

Here are the referral details for ${practice.practiceName} (${practice.contactName}):

👨‍⚕️ Lead Optometrist: ${practice.contactName} (GOC: ${practice.gocNumber})
🏥 Practice: ${practice.practiceName}
📍 Address: ${practice.addressLine1}, ${practice.city} (${practice.postcode})
📞 Phone: ${practice.phone}
✉️ Email: ${practice.email}
${practice.website ? `🌐 Website: ${practice.website}\n` : ''}
Key Services & Diagnostic Equipment:
${practice.specialities.map((s) => `• ${s.name} (${s.referralType === 'referral_required' ? 'Referral Required' : 'Self-Referral Allowed'})`).join('\n')}

View full listing online:
${typeof window !== 'undefined' ? window.location.href : ''}
`;

  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${emailSubject}&body=${encodeURIComponent(emailBodyText)}`;

  return (
    <>
      {/* Condensed Clinical Referral Slip (Print Only) */}
      <div
        id="print-referral-slip"
        className="hidden print:block font-sans text-slate-950 border-2 border-slate-900 rounded-xl p-5 space-y-3 bg-white"
      >
        {/* Clinical Header Bar */}
        <div className="border-b-2 border-slate-900 pb-2 flex items-end justify-between">
          <div>
            <span className="text-xs font-black uppercase text-teal-950 tracking-widest block">
              CLINICAL OPTOMETRY REFERRAL SLIP
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">
              Optom Directory UK • Test Room Patient Handout & Clinical Referral
            </span>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <span className="font-extrabold text-slate-900">Date:</span> {todayDate}
          </div>
        </div>

        {/* Practitioner & Clinic Info (2-Column Grid) */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-300">
          <div>
            <span className="text-[9px] font-bold text-teal-800 uppercase tracking-wider block mb-0.5">
              Receiving Practitioner / Practice:
            </span>
            <p className="font-extrabold text-slate-900 text-sm">{practice.contactName}</p>
            <p className="text-[10px] font-bold text-teal-900">GOC Reg: {practice.gocNumber}</p>
            <p className="font-semibold text-slate-900 mt-1">{practice.practiceName}</p>
            <p className="text-slate-700 text-[11px]">
              {practice.addressLine1}
              {practice.addressLine2 ? `, ${practice.addressLine2}` : ''}, {practice.city} ({practice.postcode})
            </p>
          </div>

          <div className="space-y-1 text-[11px] text-slate-700 border-l border-slate-200 pl-4">
            <span className="text-[9px] font-bold text-teal-800 uppercase tracking-wider block mb-0.5">
              Appointments & Contact Info:
            </span>
            <p>📞 <strong>Phone:</strong> {practice.phone}</p>
            <p>✉️ <strong>Email:</strong> {practice.email}</p>
            {practice.website && (
              <p className="truncate">🌐 <strong>Web:</strong> {practice.website.replace(/^https?:\/\//, '')}</p>
            )}
          </div>
        </div>

        {/* Specialities & Diagnostic Equipment Badges */}
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-700 block">
            Clinical Services & Diagnostic Equipment Available ({practice.specialities.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {practice.specialities.map((s) => (
              <span
                key={s.id}
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900 shadow-2xs"
              >
                {s.name} <span className="font-normal text-slate-600">({s.referralType === 'referral_required' ? 'Referral Only' : 'Self-Referral'})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Test-Room Referring Optometrist Notes Section */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-900 border-b border-slate-200 pb-1">
            <span>✍️ REFERRING OPTOMETRIST TEST-ROOM NOTES / REASON FOR REFERRAL</span>
            <span className="text-slate-500 font-normal">Patient Handout Copy</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-800">
            <div><strong>Patient Name:</strong> ____________________________</div>
            <div><strong>DOB / Ref:</strong> __________________</div>
          </div>

          <div className="space-y-2 text-[11px] text-slate-800 pt-0.5">
            <div><strong>Clinical Notes / Symptoms:</strong></div>
            <div className="border-b border-dotted border-slate-400 h-3"></div>
            <div className="border-b border-dotted border-slate-400 h-3"></div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 text-slate-700 border-t border-slate-100">
            <div><strong>Referring Optom:</strong> ____________</div>
            <div><strong>GOC Reg:</strong> ____________</div>
            <div><strong>Signature:</strong> ____________</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <span>UK Optometrist Directory • www.optomdirectory.co.uk</span>
          <span>Optometry Listing Handout</span>
        </div>
      </div>

      {/* Screen Toolbar Controls */}
      <div className="print:hidden flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
          title="Print compact clinical referral slip"
        >
          <Printer className="w-4 h-4 text-teal-700" />
          <span>Print Referral Slip</span>
        </button>

        <button
          type="button"
          onClick={() => setShowEmailModal(true)}
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

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Patient's Email Address (Optional):
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Email Summary Preview:</span>
                <p className="text-[11px]"><strong>Practitioner:</strong> {practice.contactName} ({practice.practiceName})</p>
                <p className="text-[11px]"><strong>Phone:</strong> {practice.phone}</p>
                <p className="text-[11px]"><strong>Address:</strong> {practice.addressLine1}, {practice.city} ({practice.postcode})</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <a
                href={mailtoUrl}
                onClick={() => setShowEmailModal(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email App</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
