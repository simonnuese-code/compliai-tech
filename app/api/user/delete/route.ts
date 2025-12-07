import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the user. 
    // Due to onDelete: Cascade in schema.prisma, this will also delete:
    // - ComplianceChecks
    // - Tasks
    // - Documents
    await prisma.user.delete({
      where: {
        id: session.user.id
      }
    })

    // Clear the session cookie
    const cookieStore = await cookies()
    cookieStore.delete('session')

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
