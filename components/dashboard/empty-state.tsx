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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <Icon className="w-8 h-8 text-sky-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
                {description}
            </p>
            {action}
        </div>
    )
}
