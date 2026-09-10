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
    .select({ specialityId: listingSpecialities.specialityId })
    .from(listingSpecialities)
    .where(eq(listingSpecialities.listingId, practice.id));

  const specialityIds = currentSpecialities.map((s) => s.specialityId);

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
    specialityIds,
  };

  return {
    practice,
    initialFormData,
  };
}

export default async function EditListingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getListingByEditToken(resolvedParams.token);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <Edit3 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Practice Listing: {data.practice.practiceName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Update your clinic contact details, address, specialities, or profile description below.
          </p>
        </div>

        {/* Clear Banner warning re-approval */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-950 block">
              Notice: Editing Requires Admin Re-Approval
            </span>
            <p className="leading-relaxed">
              Saving updates to your listing will temporarily set its status back to <strong>pending</strong>. Your listing will re-enter the review queue and require admin verification before edits go live on the public directory.
            </p>
          </div>
        </div>

        <MultiStepForm
          initialData={data.initialFormData}
          editToken={resolvedParams.token}
          isEditMode={true}
        />
      </main>
    </div>
  );
}
