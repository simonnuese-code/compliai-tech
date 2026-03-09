import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import HubPageClient from '@/components/hub/HubPage'

export default async function HubPage() {
    const session = await getSession()

    if (!session.isLoggedIn || !session.user?.id) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
    })

    if (!user) {
        redirect('/login')
    }

    return <HubPageClient user={user} />
}
