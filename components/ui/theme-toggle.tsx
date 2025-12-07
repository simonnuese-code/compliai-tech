"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null // Avoid hydration mismatch
    }

    const isDark = theme === "dark"

    return (
        <div
            className={cn(
                "relative flex items-center p-1 rounded-full cursor-pointer w-20 h-10 transition-colors duration-300",
                isDark ? "bg-slate-800" : "bg-slate-200",
                className
            )}
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {/* Track Icons */}
            <div className="absolute left-2.5 text-slate-500 z-10">
                <Sun className="w-5 h-5" />
            </div>
            <div className="absolute right-2.5 text-slate-500 z-10">
                <Moon className="w-5 h-5" />
            </div>

            {/* Sliding Thumb */}
            <motion.div
                className="absolute w-8 h-8 bg-white rounded-full shadow-md z-20 flex items-center justify-center"
                initial={false}
                animate={{
                    x: isDark ? 40 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
            >
                {/* Active Icon in Thumb (Optional, or just let thumb cover track icons) */}
                {/* For this design, let's keep the thumb simple or maybe show the active icon in color? */}
                {isDark ? (
                    <Moon className="w-5 h-5 text-slate-900" />
                ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                )}
            </motion.div>
        </div>
    )
}
