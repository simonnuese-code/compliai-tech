'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: ReactNode
    value: string | number
    icon: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: 'blue' | 'green' | 'amber' | 'red'
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
    const colorClasses = {
        blue: 'text-sky-400',
        green: 'text-emerald-400',
        amber: 'text-amber-400',
        red: 'text-red-400'
    }

    return (
        <GlassCard hover padding="lg">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "font-bold text-slate-900 dark:text-slate-100 mt-2",
                            typeof value === 'string' && value.length > 8 ? "text-2xl" : "text-3xl"
                        )}
                    >
                        {value}
                    </motion.p>
                    {trend && (
                        <p className={cn(
                            "text-sm mt-2 font-medium",
                            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}%
                        </p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl",
                    "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800",
                    colorClasses[color]
                )}>
                    {icon}
                </div>
            </div>
        </GlassCard>
    )
}
