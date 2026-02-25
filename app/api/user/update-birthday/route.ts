import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBirthdaySchema = z.object({
  birthday: z.string().nullable(), // ISO date string or null to remove
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateBirthdaySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Ungültige Eingaben' }, { status: 400 })
    }

    const { birthday } = result.data

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        birthday: birthday ? new Date(birthday) : null,
      },
    })

    return NextResponse.json({ message: 'Geburtstag erfolgreich aktualisiert' })
  } catch (error) {
    console.error('Update birthday error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
