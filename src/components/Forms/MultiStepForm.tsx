'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingFormSchema, ListingFormValues } from '@/schemas/listing';
import FormStep1Details from './FormStep1Details';
import FormStep2Address from './FormStep2Address';
import FormStep3Specialities from './FormStep3Specialities';
import FormStep4Review from './FormStep4Review';
import { Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Copy } from 'lucide-react';

interface MultiStepFormProps {
  initialData?: ListingFormValues;
  editToken?: string;
  isEditMode?: boolean;
}

const DEFAULT_FORM_DATA: ListingFormValues = {
  practiceName: '',
  contactName: '',
  gocNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: 'Aberdeen',
  postcode: '',
  latitude: 57.1497,
  longitude: -2.0943,
  phone: '',
  email: '',
  website: '',
  description: '',
  specialityIds: [],
  subscribeUpdates: true,
};

const STEPS = [
  'Practice Info',
  'Address & Location',
  'Specialities',
  'Review & Submit',
];

export default function MultiStepForm({
  initialData,
  editToken,
  isEditMode = false,
}: MultiStepFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ListingFormValues>(
    initialData || DEFAULT_FORM_DATA
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    editUrl: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const updateFields = (fields: Partial<ListingFormValues>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    setErrors({});
  };

  const validateCurrentStep = (): boolean => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      const step1Result = listingFormSchema
        .pick({
          practiceName: true,
          contactName: true,
          gocNumber: true,
          phone: true,
          email: true,
          website: true,
          description: true,
        })
        .safeParse(formData);

      if (!step1Result.success) {
        step1Result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
    }

    if (currentStep === 1) {
      const step2Result = listingFormSchema
        .pick({
          addressLine1: true,
          addressLine2: true,
          city: true,
          postcode: true,
          latitude: true,
          longitude: true,
        })
        .safeParse(formData);

      if (!step2Result.success) {
        step2Result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.specialityIds || formData.specialityIds.length === 0) {
        setErrors({ specialityIds: 'Please select at least one clinical speciality.' });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full validation
    const fullValidation = listingFormSchema.safeParse(formData);
    if (!fullValidation.success) {
      const newErrors: Record<string, string> = {};
      fullValidation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = isEditMode ? `/api/edit/${editToken}` : '/api/submit';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setErrors({ form: data.error || 'Failed to submit listing.' });
        return;
      }

      setSubmittedResult({
        editUrl: data.editUrl || `${window.location.origin}/edit/${editToken}`,
        message: isEditMode
          ? 'Your changes have been saved and sent for re-approval.'
          : 'Your practice listing has been submitted for admin verification.',
      });
    } catch {
      setErrors({ form: 'An unexpected network error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyEditLink = () => {
    if (submittedResult?.editUrl) {
      navigator.clipboard.writeText(submittedResult.editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isEditMode ? 'Listing Updated Successfully!' : 'Submission Received!'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {submittedResult.message}
          </p>
        </div>

        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 text-left space-y-1.5 text-teal-900">
          <span className="text-xs font-bold block flex items-center gap-1">
            ⏳ Pending Verification Notice:
          </span>
          <p className="text-xs leading-relaxed text-teal-800">
            All new practice submissions are verified by our team before being published live to ensure directory accuracy. You will receive an email notification once your listing goes live!
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
          <span className="text-xs font-bold text-slate-900 block">
            🔑 Your Secret Edit Link:
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Save this URL to return and edit your practice listing or update your specialized procedures at any time.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={submittedResult.editUrl}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={copyEditLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Go to Practitioner Portal
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Return to Directory Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Progress Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {STEPS.map((label, idx) => {
            const isDone = currentStep > idx;
            const isCurrent = currentStep === idx;
            return (
              <div key={label} className="flex-1 text-center">
                <div className="flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-800 text-white ring-4 ring-teal-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                </div>
                <span
                  className={`mt-1.5 block text-[11px] font-medium truncate px-1 ${
                    isCurrent ? 'text-teal-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {errors.form && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
          {errors.form}
        </div>
      )}

      {/* Form Step Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 0 && (
          <FormStep1Details
            formData={formData}
            updateFields={updateFields}
            errors={errors}
          />
        )}

        {currentStep === 1 && (
          <FormStep2Address
            formData={formData}
            updateFields={updateFields}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <FormStep3Specialities
            formData={formData}
            updateFields={updateFields}
            errors={errors}
          />
        )}

        {currentStep === 3 && (
          <FormStep4Review formData={formData} updateFields={updateFields} />
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || submitting}
            className="inline-flex items-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <span>Continue to Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isEditMode ? 'Save & Request Re-Approval' : 'Submit Practice Listing'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
