import './globals.css';
import type { Metadata } from 'next';
import DevEventGuard from '@/components/UI/DevEventGuard';

export const metadata: Metadata = {
  title: 'Optom Directory',
  description: 'Find UK optometrists by clinical speciality, equipment, and referral options.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <DevEventGuard />
        {children}
      </body>
    </html>
  );
}
