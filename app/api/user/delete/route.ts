import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Destroy the session first so the user is logged out
    session.destroy()

    // Delete the user. 
    // Due to onDelete: Cascade in schema.prisma, this will also delete:
    // - ComplianceChecks
    // - Tasks
    // - Documents
    await prisma.user.delete({
      where: {
        id: userId
      }
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
