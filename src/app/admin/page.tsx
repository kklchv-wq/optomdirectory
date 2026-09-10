import Header from '@/components/UI/Header';
import AdminDashboard from '@/components/Admin/AdminDashboard';

export const metadata = {
  title: 'Admin Verification Queue | Optom Speciality Directory',
  description: 'Admin verification portal for approving or rejecting optometry practice listings.',
};

/**
 * PRODUCTION TODO: Replace single-password check with real Auth solution (e.g. NextAuth / Lucia)
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
