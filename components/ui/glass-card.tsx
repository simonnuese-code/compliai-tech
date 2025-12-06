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
                // Base styles matching Landing Page
                "backdrop-blur-xl bg-white/5 border border-white/10",
                "rounded-2xl shadow-xl",
                paddingClasses[padding],
                hover && "cursor-pointer transition-shadow hover:shadow-2xl hover:bg-white/10",
                className
            )}
        >
            {children}
        </motion.div>
    )
}
