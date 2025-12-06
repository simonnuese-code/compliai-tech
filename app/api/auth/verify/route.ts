import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = verifySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingaben' },
        { status: 400 }
      )
    }

    const { email, code } = result.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User nicht gefunden' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email bereits verifiziert' },
        { status: 400 }
      )
    }

    if (!user.verificationToken || !user.verificationTokenExpiry) {
      return NextResponse.json(
        { error: 'Kein Verifizierungscode vorhanden' },
        { status: 400 }
      )
    }

    if (new Date() > user.verificationTokenExpiry) {
      return NextResponse.json(
        { error: 'Code abgelaufen' },
        { status: 400 }
      )
    }

    if (user.verificationToken !== code) {
      return NextResponse.json(
        { error: 'Falscher Code' },
        { status: 400 }
      )
    }

    // Email verifizieren und Token löschen
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    })

    // Session erstellen (User ist jetzt eingeloggt)
    const session = await getSession()
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    }
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      message: 'Email erfolgreich verifiziert',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    )
  }
}
