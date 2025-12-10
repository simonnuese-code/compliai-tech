import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
        <Toaster />

        {/* Leadfeeder Tracking */}
        <Script id="leadfeeder-tracking" strategy="afterInteractive">
          {`
            (function(ss,ex){
              window.ldfdr=window.ldfdr||function(){(ldfdr.q=ldfdr.q||[]).push([].slice.call(arguments));};
              (function(d,s){
                fs=d.getElementsByTagName(s)[0];
                function ce(src){
                  var cs=d.createElement(s);
                  cs.src=src;
                  cs.async=1;
                  fs.parentNode.insertBefore(cs,fs);
                }
                ce('https://sc.lfeeder.com/lftracker_v1_'+ss+(ex?'_'+ex:'')+'.js');
              })(document,'script');
            })('${process.env.NEXT_PUBLIC_LEADFEEDER_ID || "YOUR_LEADFEEDER_ID"}');
          `}
        </Script>
      </body>
    </html>
  );
}
