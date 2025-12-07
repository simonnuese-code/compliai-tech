'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function DarkModeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const isDark = theme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className={cn(
                // Position
                "fixed top-6 right-6 z-50",
                // Size & Shape
                "w-14 h-7 rounded-full",
                // Styling
                "relative backdrop-blur-xl border",
                "transition-all duration-300 ease-in-out",
                // Colors
                isDark
                    ? "bg-sky-500/80 border-sky-400/50"
                    : "bg-gray-300/80 border-gray-400/50",
                // Hover
                "hover:shadow-lg"
            )}
        >
            {/* Slider Ball */}
            <div
                className={cn(
                    "absolute top-0.5",
                    "w-6 h-6 rounded-full",
                    "bg-white shadow-md",
                    "flex items-center justify-center",
                    "transition-transform duration-300 ease-in-out",
                    isDark ? "translate-x-7" : "translate-x-0.5"
                )}
            >
                {/* Optional Icon */}
                {isDark ? (
                    <Moon className="w-3 h-3 text-slate-700" />
                ) : (
                    <Sun className="w-3 h-3 text-amber-500" />
                )}
            </div>
        </button>
    )
}
