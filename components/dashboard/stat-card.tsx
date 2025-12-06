import { GlassCard } from '@/components/ui/glass-card'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: 'blue' | 'green' | 'amber' | 'red'
}

export function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
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
                    <p className="text-sm text-gray-400">{title}</p>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-white mt-2"
                    >
                        {value}
                    </motion.p>
                    {trend && (
                        <p className={cn(
                            "text-sm mt-2",
                            trend.isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}%
                        </p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl backdrop-blur-sm",
                    "bg-white/5 border border-white/10"
                )}>
                    <Icon className={cn("w-6 h-6", colorClasses[color])} />
                </div>
            </div>
        </GlassCard>
    )
}
