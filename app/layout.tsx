import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CompliAI - Don't just comply. Get your CompliAI",
  description: "Ihr intelligenter Co-Pilot für die EU AI Act Compliance. Prüfen Sie Ihr KI-System in 5 Minuten auf Konformität. Kostenlos, sicher und sofort verfügbar.",
  icons: {
    icon: '/compliai-logo-icon.png?v=4',
    apple: '/compliai-logo-icon.png?v=4',
  },
  openGraph: {
    title: "CompliAI - Don't just comply. Get your CompliAI",
    description: "Ihr intelligenter Co-Pilot für die EU AI Act Compliance. Prüfen Sie Ihr KI-System in 5 Minuten auf Konformität. Kostenlos, sicher und sofort verfügbar.",
    url: 'https://compliai.tech',
    siteName: 'CompliAI',
    images: [
      {
        url: '/compliai-logo-full.png',
        width: 1200,
        height: 630,
        alt: 'CompliAI Dashboard',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CompliAI - Don't just comply. Get your CompliAI",
    description: "Ihr intelligenter Co-Pilot für die EU AI Act Compliance. Prüfen Sie Ihr KI-System in 5 Minuten auf Konformität.",
    images: ['/compliai-logo-full.png'],
  },
};

export const viewport = {
  themeColor: '#06b6d4', // Cyan-500
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-600`}
      >
        {children}
      </body>
    </html>
  );
}
