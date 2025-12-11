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
  title: "CompliAI - Der AI Act Compliance Copilot",
  description: "CompliAI ist Ihre intelligente Lösung für EU AI Act Konformität. Automatisierte Risikoanalyse, Dokumentation und Compliance-Checks für KI-Systeme.",
  keywords: ["CompliAI", "EU AI Act", "AI Compliance", "KI Regulierung", "AI Act Checker", "Compliance Software", "SaaS", "Startup"],
  icons: {
    icon: '/compliai-logo-icon.png?v=4',
    apple: '/compliai-logo-icon.png?v=4',
  },
  openGraph: {
    title: "CompliAI - Der AI Act Compliance Copilot",
    description: "CompliAI ist Ihre intelligente Lösung für EU AI Act Konformität. Automatisierte Risikoanalyse, Dokumentation und Compliance-Checks für KI-Systeme.",
    url: 'https://www.compliai.tech',
    siteName: 'CompliAI',
    images: [
      {
        url: '/compliai-logo-full.png',
        width: 1200,
        height: 630,
        alt: 'CompliAI Plattform',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CompliAI - Der AI Act Compliance Copilot",
    description: "Automatisierte Risikoanalyse, Dokumentation und Compliance-Checks für den EU AI Act.",
    images: ['/compliai-logo-full.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
              window.ldfdr=window.ldfdr||function(){(ldfdr._q=ldfdr._q||[]).push([].slice.call(arguments));};
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
            })('${process.env.NEXT_PUBLIC_LEADFEEDER_ID || "ywVkO4XmmlzaZ6Bj"}');
          `}
        </Script>

        {/* Structured Data (SEO) */}
        <Script id="schema-org" strategy="beforeInteractive" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CompliAI",
              "url": "https://www.compliai.tech",
              "logo": "https://www.compliai.tech/compliai-logo-icon.png",
              "sameAs": [
                "https://www.linkedin.com/company/compliai",
                "https://twitter.com/compliai"
              ],
              "description": "CompliAI ist Ihre intelligente Lösung für EU AI Act Konformität.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Münster",
                "addressCountry": "DE"
              }
            }
          `}
        </Script>
        <Script id="schema-software" strategy="beforeInteractive" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CompliAI Platform",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              }
            }
          `}
        </Script>

        {/* Hotjar / ContentSquare Tracking */}
        <Script
          id="contentsquare-tracking"
          src="https://t.contentsquare.net/uxa/57bb9df73d48e.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
