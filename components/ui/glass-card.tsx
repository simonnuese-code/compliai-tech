'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
    children: ReactNode
    className?: string
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    onClick?: () => void
}

export function GlassCard({
    children,
    className,
    hover = false,
    padding = 'md',
    onClick
}: GlassCardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    }

    return (
        <motion.div
            whileHover={hover ? { scale: 1.02, y: -4 } : {}}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={cn(
                // Base styles matching Landing Page (Light Mode)
                "bg-white dark:bg-slate-900/50 dark:backdrop-blur-md border border-slate-200 dark:border-slate-800",
                "rounded-xl shadow-sm dark:shadow-none",
                paddingClasses[padding],
                hover && "cursor-pointer transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/80",
                className
            )}
        >
            {children}
        </motion.div>
    )
}
