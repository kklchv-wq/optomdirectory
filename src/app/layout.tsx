import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import DevEventGuard from '@/components/UI/DevEventGuard';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';

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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <DevEventGuard />
        {children}
      </body>
    </html>
  );
}
