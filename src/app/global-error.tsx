'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 antialiased">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error?.message || 'An unhandled application error occurred. Click below to reload.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
