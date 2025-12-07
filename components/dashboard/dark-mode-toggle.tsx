"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function DarkModeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "fixed top-4 right-4 md:top-6 md:right-6 z-50",
                "w-10 h-10 md:w-12 md:h-12",
                "rounded-full backdrop-blur-xl",
                "bg-slate-900/5 dark:bg-white/10",
                "border border-slate-900/10 dark:border-white/10",
                "hover:bg-slate-900/10 dark:hover:bg-white/20",
                "transition-all duration-300",
                "flex items-center justify-center",
                "shadow-sm"
            )}
            aria-label="Toggle Dark Mode"
        >
            <div className="relative w-6 h-6">
                <Sun
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 rotate-0 scale-100 text-slate-700 dark:text-slate-200",
                        isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                    )}
                />
                <Moon
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 rotate-90 scale-0 text-slate-700 dark:text-slate-200",
                        isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                    )}
                />
            </div>
        </button>
    )
}
