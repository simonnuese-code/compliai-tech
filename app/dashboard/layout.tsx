import { Sidebar } from '@/components/dashboard/sidebar'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { DarkModeToggle } from '@/components/dashboard/dark-mode-toggle'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Auth Check
    const session = await getSession()

    if (!session.isLoggedIn || !session.user?.id) {
        redirect('/login')
    }

    // Get User Data
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
    })

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="flex">
                <Sidebar user={user} />

                <DarkModeToggle />

                <main className="flex-1 lg:pl-0 pl-0 relative">
                    <div className="max-w-7xl mx-auto p-6 pt-20 lg:p-8 lg:pt-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
