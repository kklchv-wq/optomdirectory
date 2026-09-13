'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingFormSchema, ListingFormValues } from '@/schemas/listing';
import FormStep1Details from './FormStep1Details';
import FormStep2Address from './FormStep2Address';
import FormStep3Specialities from './FormStep3Specialities';
import FormStep4Review from './FormStep4Review';
import { Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { trackEvent } from '@/lib/gtag';

interface MultiStepFormProps {
  initialData?: ListingFormValues;
  editToken?: string;
  isEditMode?: boolean;
  initialStep?: number;
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
  'Services & Equipment',
  'Review & Submit',
];

export default function MultiStepForm({
  initialData,
  editToken,
  isEditMode = false,
  initialStep = 0,
}: MultiStepFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<ListingFormValues>(
    initialData || DEFAULT_FORM_DATA
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    editUrl: string;
    message: string;
    reapprovalRequired?: boolean;
    slug?: string;
  } | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
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
        setErrors({ specialityIds: 'Please select at least one clinical speciality or equipment item.' });
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

  const jumpToStep = (targetStep: number) => {
    // Allow jumping freely in edit mode or when target step is <= currentStep
    if (isEditMode || targetStep <= currentStep) {
      setCurrentStep(targetStep);
    } else if (validateCurrentStep()) {
      setCurrentStep(targetStep);
    }
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

      const step0Fields = ['practiceName', 'contactName', 'gocNumber', 'phone', 'email', 'website', 'description', 'workingDays'];
      const step1Fields = ['addressLine1', 'addressLine2', 'city', 'postcode', 'latitude', 'longitude'];
      const step2Fields = ['specialityIds'];

      const errorKeys = Object.keys(newErrors);
      if (errorKeys.length > 0) {
        const currentStepFields = currentStep === 0 ? step0Fields : currentStep === 1 ? step1Fields : step2Fields;
        const hasErrorInCurrentStep = errorKeys.some((key) => currentStepFields.includes(key));

        if (!hasErrorInCurrentStep) {
          if (errorKeys.some((key) => step0Fields.includes(key))) setCurrentStep(0);
          else if (errorKeys.some((key) => step1Fields.includes(key))) setCurrentStep(1);
          else if (errorKeys.some((key) => step2Fields.includes(key))) setCurrentStep(2);
        }
      }

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
        const detailMsg = data.details
          ? Object.entries(data.details)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : (data.error || 'Failed to submit listing.');
        setErrors({ form: detailMsg });
        return;
      }

      trackEvent({
        action: isEditMode ? 'edit_listing' : 'submit_listing',
        category: 'practitioner',
        label: formData.practiceName,
      });

      if (isEditMode) {
        setSaveSuccessMessage(
          data.message || (
            data.reapprovalRequired === false
              ? '✨ Services & equipment updated live on your profile!'
              : 'ℹ️ Practice details saved and queued for admin re-approval.'
          )
        );
        setTimeout(() => setSaveSuccessMessage(null), 8000);
      } else {
        setSubmittedResult({
          editUrl: data.editUrl || `${window.location.origin}/edit/${editToken}`,
          reapprovalRequired: data.reapprovalRequired ?? true,
          message: data.message || 'Your practice listing has been submitted for admin verification.',
        });
      }
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
    const isLiveUpdate = isEditMode && submittedResult.reapprovalRequired === false;

    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
          isLiveUpdate ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'
        }`}>
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isLiveUpdate
              ? '✨ Services & Equipment Updated Live!'
              : (isEditMode ? 'Listing Details Updated!' : 'Submission Received!')}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {submittedResult.message}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {submittedResult.slug ? (
            <button
              type="button"
              onClick={() => router.push(`/optometrist/${submittedResult.slug}`)}
              className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              View Listing Profile
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Go to Practitioner Portal
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Return to Directory Search
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
              <button
                type="button"
                key={label}
                onClick={() => jumpToStep(idx)}
                className="flex-1 text-center group cursor-pointer focus:outline-none"
              >
                <div className="flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-800 text-white ring-4 ring-teal-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-teal-50'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                </div>
                <span
                  className={`mt-1.5 block text-[11px] font-medium truncate px-1 transition-colors ${
                    isCurrent
                      ? 'text-teal-900 font-bold'
                      : 'text-slate-500 group-hover:text-teal-700'
                  }`}
                >
                  {label}
                </span>
              </button>
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

      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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

          <div className="flex items-center gap-2">
            {isEditMode && currentStep < STEPS.length - 1 && (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isEditMode ? 'Save & Update Live' : 'Submit Practice Listing'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
