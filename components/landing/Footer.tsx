'use client'

import Link from 'next/link'
import Image from 'next/image'

// Trigger redeploy for env vars
export default function Footer() {
  return (
    <footer className="relative py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="backdrop-blur-xl bg-white/40 rounded-3xl p-8 border border-white/40 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/compliai-logo-full.png"
                alt="CompliAI"
                width={220}
                height={56}
                className="h-14 w-auto opacity-80"
                unoptimized
              />
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link
                href="/impressum"
                className="hover:text-slate-900 transition-colors"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="hover:text-slate-900 transition-colors"
              >
                Datenschutz
              </Link>
              <Link
                href="/agb"
                className="hover:text-slate-900 transition-colors"
              >
                AGB
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-slate-500">
              {new Date().getFullYear()} <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">CompliAI</span>. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
