import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mb-4">
                <Icon className="w-8 h-8 text-cyan-500" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {description}
            </p>
            {action}
        </div>
    )
}
