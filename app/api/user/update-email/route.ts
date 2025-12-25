import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateEmailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Ungültige Eingaben' }, { status: 400 })
    }

    const { newEmail, password } = result.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Bitte nutzen Sie den Login-Provider (Google/Apple/GitHub) um Ihre E-Mail zu ändern.' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Passwort ist falsch' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'E-Mail wird bereits verwendet' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail },
    })

    return NextResponse.json({ message: 'E-Mail erfolgreich geändert' })
  } catch (error) {
    console.error('Update email error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
