import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About & Contact',
  description: 'Learn more about Optom Directory, contact our team, and discover how to connect with specialist optometrists across the UK.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
