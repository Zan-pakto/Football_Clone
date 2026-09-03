import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootyIntel AI | Smart Football Predictions & Live Data",
  description:
    "AI-powered football predictions, 1X2 odds, goal tips, BTTS predictions, confidence scores, and real-time live match updates.",
  keywords: ["football predictions", "AI football tips", "1X2 odds", "over under goals", "btts tips", "live scores"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}