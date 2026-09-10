'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Something went wrong!</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          An unexpected error occurred while loading this view. You can click below to retry.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
