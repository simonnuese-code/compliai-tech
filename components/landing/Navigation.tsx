'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

interface NavigationProps {
  user?: { name?: string | null; email: string } | null;
}

export default function Navigation({ user }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
        ? 'bg-white/20 backdrop-blur-md border-white/20 shadow-sm'
        : 'bg-transparent border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="relative flex items-center group py-2">
            {/* Desktop: Full Logo - larger */}
            <div className="hidden md:block">
              <Image
                src="/compliai-logo-full.png?v=3"
                alt="CompliAI - AI-Co-Pilot for EU Compliance"
                width={200}
                height={53}
                className="h-10 md:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
                unoptimized
              />
            </div>
            {/* Mobile: Icon Only - larger */}
            <div className="block md:hidden">
              <Image
                src="/compliai-logo-icon.png"
                alt="CompliAI"
                width={40}
                height={40}
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-4">
            {/* Pricing Button */}
            <div className="mr-1 md:mr-2">
              <Button
                asChild
                className="bg-white/50 hover:bg-white/80 text-slate-700 border border-slate-200 shadow-sm transition-all rounded-full px-3 py-2 text-xs h-auto md:px-6 md:py-2.5 md:text-sm"
              >
                <Link href="/pricing">
                  Preise
                </Link>
              </Button>
            </div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 hidden md:block">
                  {user.name || user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  className="bg-white/50 hover:bg-white/80 text-slate-700 border border-slate-200 shadow-sm transition-all rounded-full px-6"
                >
                  Logout
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 border-0 transition-all rounded-full px-6"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 border-0 transition-all rounded-full px-6"
                >
                  <Link href="/login">Login</Link>
                </Button>

                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 border-0 transition-all rounded-full px-6"
                >
                  <Link href="/register">Registrieren</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
