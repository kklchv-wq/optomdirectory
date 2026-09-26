import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import DevEventGuard from '@/components/UI/DevEventGuard';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.optomdirectory.co.uk';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Optom Directory | UK Optometrist & Referral Finder',
    template: '%s | Optom Directory',
  },
  description: 'Find UK optometrists by clinical speciality, equipment, and referral options. Search for MECS, CUES, glaucoma specialists, and independent prescribing optometrists.',
  keywords: ['optometrist', 'optician', 'UK', 'referral', 'MECS', 'CUES', 'glaucoma', 'independent prescribing', 'eye care', 'specialist optometrist'],
  authors: [{ name: 'Optom Directory' }],
  creator: 'Optom Directory',
  publisher: 'Optom Directory',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    title: 'Optom Directory | UK Optometrist & Referral Finder',
    description: 'Find UK optometrists by clinical speciality, equipment, and referral options.',
    siteName: 'Optom Directory',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optom Directory | UK Optometrist & Referral Finder',
    description: 'Find UK optometrists by clinical speciality, equipment, and referral options.',
  },
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
