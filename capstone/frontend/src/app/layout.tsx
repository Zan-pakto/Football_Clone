import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aegis-Vision | Real-Time Search & Rescue Mission Control',
  description:
    'AI-ML based intelligent de-smoking/de-hazing and thermal victim localization system (SIH1417 & SIH1422)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080b11] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
