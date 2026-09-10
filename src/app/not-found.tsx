import Link from 'next/link';
import Header from '@/components/UI/Header';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4 w-full">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The page or optometrist listing you are looking for does not exist or has been moved.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory Search</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
