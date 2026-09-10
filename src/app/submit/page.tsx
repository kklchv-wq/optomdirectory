import Header from '@/components/UI/Header';
import MultiStepForm from '@/components/Forms/MultiStepForm';
import { PlusCircle } from 'lucide-react';

export const metadata = {
  title: 'Register Practice | Optom Directory',
  description: 'Register your optometry practice and clinical specialities in the UK directory.',
};

export default function SubmitListingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Register Your Optometry Practice
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Create a free practitioner listing to allow colleagues in your area to refer patients directly for specialized equipment (e.g. Optomap, OCT) and clinical skills (e.g. Scleral Lenses, IP, Colorimetry).
          </p>
        </div>

        <MultiStepForm />
      </main>
    </div>
  );
}
