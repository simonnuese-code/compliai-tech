import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updatePasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Ungültige Eingaben' }, { status: 400 })
    }

    const { currentPassword, newPassword } = result.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (!user.passwordHash) {
       return NextResponse.json({ error: 'Sie nutzen einen Social Login (kein Passwort gesetzt).' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ message: 'Passwort erfolgreich geändert' })
  } catch (error) {
    console.error('Update password error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
