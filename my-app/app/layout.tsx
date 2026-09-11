import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JollofTips | Smart AI Football Predictions & Live Data",
  description:
    "AI-powered football predictions, 1X2 odds, goal tips, BTTS predictions, confidence scores, and real-time live match updates.",
  keywords: ["JollofTips", "football predictions", "AI football tips", "1X2 odds", "over under goals", "btts tips", "live scores"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

import Footer from "@/components/Footer";
import NavigationLoader from "@/components/NavigationLoader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable}`}>
      <body className="antialiased min-h-screen flex flex-col text-slate-100 selection:bg-purple-500/30 selection:text-purple-200">
        <NavigationLoader />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}