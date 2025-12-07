'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home,
    CheckCircle,
    FileText,
    AlertTriangle,
    ListTodo,
    BarChart3,
    Settings,
    HelpCircle,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
    href: string
    label: string
    icon: any
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Übersicht', icon: Home },
    { href: '/dashboard/check', label: 'Compliance Check', icon: CheckCircle },
    { href: '/dashboard/dokumentation', label: 'Dokumentation', icon: FileText },
    { href: '/dashboard/risikoanalyse', label: 'Risikoanalyse', icon: AlertTriangle },
    { href: '/dashboard/aufgaben', label: 'Aufgaben', icon: ListTodo },
    { href: '/dashboard/berichte', label: 'Berichte', icon: BarChart3 },
    { href: '/dashboard/einstellungen', label: 'Einstellungen', icon: Settings },
    { href: '/dashboard/hilfe', label: 'Hilfe', icon: HelpCircle },
]

interface SidebarProps {
    user: {
        name: string | null
        email: string
    }
}

export function Sidebar({ user }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn("p-6 border-b border-slate-100", collapsed && "px-2 py-4")}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn("flex items-center gap-3", collapsed && "flex-col gap-4")}
                >
                    {!collapsed ? (
                        <Link href="/" className="relative h-10 w-48 block transition-opacity hover:opacity-80">
                            <Image
                                src="/compliai-logo-transparent.png"
                                alt="CompliAI"
                                fill
                                className="object-contain object-left"
                                priority
                                unoptimized
                            />
                        </Link>
                    ) : (
                        <Link href="/" className="relative h-8 w-8 block transition-opacity hover:opacity-80">
                            <Image
                                src="/compliai-logo-icon.png"
                                alt="CompliAI"
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "p-2 hover:bg-slate-100 rounded-lg transition-colors",
                            !collapsed && "ml-auto"
                        )}
                    >
                        <ChevronLeft className={cn(
                            "w-5 h-5 text-slate-400 transition-transform",
                            collapsed && "rotate-180"
                        )} />
                    </button>
                </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                "hover:bg-slate-50",
                                isActive
                                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                                    : "text-slate-500 font-medium",
                                collapsed && "justify-center"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-colors",
                                isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {!collapsed && (
                                <span>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-100">
                {!collapsed ? (
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 mb-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Zur Startseite</span>
                        </Link>
                        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Abmelden</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="w-full p-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-center"
                            title="Zur Startseite"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 text-slate-400 mx-auto" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                    "hidden lg:flex flex-col h-screen sticky top-0",
                    "bg-white border-r border-slate-200 shadow-sm z-30",
                    "transition-all duration-300",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 flex items-center justify-between">
                <div className="relative h-8 w-32">
                    <Image
                        src="/compliai-logo-full.png"
                        alt="CompliAI"
                        fill
                        className="object-contain object-left"
                        priority
                        unoptimized
                    />
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <Menu className="w-6 h-6 text-slate-900" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="relative h-8 w-32">
                                    <Image
                                        src="/compliai-logo-full.png"
                                        alt="CompliAI"
                                        fill
                                        className="object-contain object-left"
                                        priority
                                        unoptimized
                                    />
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4">
                                <nav className="px-3 space-y-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                                    "hover:bg-slate-50",
                                                    isActive
                                                        ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                                                        : "text-slate-500 font-medium"
                                                )}
                                            >
                                                <Icon className={cn(
                                                    "w-5 h-5 flex-shrink-0 transition-colors",
                                                    isActive ? "text-cyan-600" : "text-slate-400"
                                                )} />
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                        {user.name?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'User'}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all text-slate-500 hover:text-rose-600"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-sm font-medium">Abmelden</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
