'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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
                src="/compliai-logo-full.png"
                alt="CompliAI - AI-Co-Pilot for EU Compliance"
                width={200}
                height={53}
                className="h-10 md:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, 200px"
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
                sizes="40px"
              />
            </div>
          </Link>

          {/* Right: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu (Hamburger) */}
          <div className="flex md:hidden items-center gap-2">
            <div className="mr-1">
              <Button
                asChild
                variant="ghost"
                className="bg-white/50 hover:bg-white/80 text-slate-700 border border-slate-200 shadow-sm transition-all rounded-full px-3 h-8 text-xs"
              >
                <Link href="/pricing">Preise</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-slate-950/95 border-slate-800 text-white backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="text-left text-white/90 flex items-center gap-2">
                    <Image
                      src="/compliai-logo-icon.png"
                      alt="CompliAI"
                      width={30}
                      height={30}
                      className="w-8 h-8 rounded-lg"
                    />
                    <span>Menu</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 mt-10">
                  {user ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Account</span>
                        <div className="bg-white/5 px-4 py-3 rounded-lg border border-white/10 mb-2">
                          <div className="font-medium text-white">{user.name || "Benutzer"}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>

                        <Button asChild className="w-full justify-start bg-gradient-to-r from-cyan-500 to-blue-600 border-0">
                          <Link href="/dashboard">Zum Dashboard</Link>
                        </Button>
                        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10">
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Starten</span>
                        <Button asChild className="w-full justify-start text-lg h-12 bg-white text-slate-900 hover:bg-slate-200">
                          <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild className="w-full justify-start text-lg h-12 bg-gradient-to-r from-cyan-500 to-blue-600 border-0">
                          <Link href="/register">Kostenlos registrieren</Link>
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-white/10 my-2" />

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Links</span>
                    <Button asChild variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Link href="/pricing">Preise & Pläne</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Link href="/#features">Features</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
