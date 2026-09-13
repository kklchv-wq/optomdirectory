import { notFound } from 'next/navigation';
import Header from '@/components/UI/Header';
import MultiStepForm from '@/components/Forms/MultiStepForm';
import { db } from '@/db';
import { listings, listingSpecialities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { ListingFormValues } from '@/schemas/listing';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ step?: string; section?: string }>;
}

async function getListingByEditToken(token: string) {
  const practiceList = await db
    .select()
    .from(listings)
    .where(eq(listings.editToken, token));

  if (practiceList.length === 0) {
    return null;
  }

  const practice = practiceList[0];

  const currentSpecialities = await db
    .select({
      specialityId: listingSpecialities.specialityId,
      offeredBy: listingSpecialities.offeredBy,
      referralType: listingSpecialities.referralType,
    })
    .from(listingSpecialities)
    .where(eq(listingSpecialities.listingId, practice.id));

  const specialityIds = currentSpecialities.map((s) => s.specialityId);
  const specialityOfferedBy: Record<number, 'personal' | 'practice'> = {};
  const specialityReferralType: Record<number, 'referral_required' | 'self_referral'> = {};

  for (const s of currentSpecialities) {
    specialityOfferedBy[s.specialityId] = (s.offeredBy || 'personal') as 'personal' | 'practice';
    specialityReferralType[s.specialityId] = (s.referralType || 'self_referral') as 'referral_required' | 'self_referral';
  }

  const initialFormData: ListingFormValues = {
    practiceName: practice.practiceName,
    contactName: practice.contactName,
    gocNumber: practice.gocNumber,
    addressLine1: practice.addressLine1,
    addressLine2: practice.addressLine2 || '',
    city: practice.city,
    postcode: practice.postcode,
    latitude: practice.latitude,
    longitude: practice.longitude,
    phone: practice.phone,
    email: practice.email,
    website: practice.website || '',
    description: practice.description || '',
    workingDays: practice.workingDays
      ? (typeof practice.workingDays === 'string'
          ? (JSON.parse(practice.workingDays || '[]') as string[])
          : (practice.workingDays as string[]))
      : [],
    specialityIds,
    specialityOfferedBy,
    specialityReferralType,
  };

  return {
    practice,
    initialFormData,
  };
}

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getListingByEditToken(resolvedParams.token);

  if (!data) {
    notFound();
  }

  const stepParam = (resolvedSearchParams.step || resolvedSearchParams.section || '').toLowerCase();
  const startOnServices = stepParam === '3' || stepParam === 'services' || stepParam === 'equipment' || stepParam === 'specialities';
  const initialStep = startOnServices ? 2 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <Edit3 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {startOnServices ? 'Update Registered Services & Equipment' : `Edit Practice Listing: ${data.practice.practiceName}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {startOnServices
              ? 'Select or update the clinical services, diagnostic tools, and equipment offered at your practice.'
              : 'Update your clinic contact details, address, specialities, or profile description below.'}
          </p>
        </div>



        <MultiStepForm
          initialData={data.initialFormData}
          editToken={resolvedParams.token}
          isEditMode={true}
          initialStep={initialStep}
        />
      </main>
    </div>
  );
}
