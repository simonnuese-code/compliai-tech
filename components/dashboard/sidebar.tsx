'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    ChevronLeft
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
            <div className="p-6 border-b border-white/10">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                >
                    {!collapsed && (
                        <>
                            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                                <span className="text-white font-bold">C</span>
                            </div>
                            <span className="text-xl font-bold text-white">CompliAI</span>
                        </>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronLeft className={cn(
                            "w-5 h-5 text-gray-400 transition-transform",
                            collapsed && "rotate-180"
                        )} />
                    </button>
                </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                "hover:bg-white/10",
                                isActive && "bg-white/10 backdrop-blur-sm border border-white/20",
                                collapsed && "justify-center"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0",
                                isActive ? "text-sky-400" : "text-gray-400"
                            )} />
                            {!collapsed && (
                                <span className={cn(
                                    "text-sm font-medium",
                                    isActive ? "text-white" : "text-gray-300"
                                )}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10">
                {!collapsed ? (
                    <div className="space-y-3">
                        <div className="px-4 py-3 rounded-xl bg-white/5">
                            <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Abmelden</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 mx-auto" />
                    </button>
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
                    "backdrop-blur-xl bg-slate-900/90 border-r border-white/10",
                    "transition-all duration-300",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl backdrop-blur-xl bg-slate-900/90 border border-white/10"
            >
                {mobileOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Menu className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="lg:hidden fixed inset-y-0 left-0 w-64 backdrop-blur-xl bg-slate-900/95 border-r border-white/10 z-50"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
