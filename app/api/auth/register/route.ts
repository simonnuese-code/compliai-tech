import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1),
})

// Generiere 6-stelligen Code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingaben' },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email bereits registriert' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = generateVerificationCode()
    const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 Min

    // User erstellen OHNE emailVerified
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        verificationToken: verificationCode,
        verificationTokenExpiry,
      },
    })

    // Email senden
    const emailResult = await sendVerificationEmail(email, verificationCode, name)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Email konnte nicht gesendet werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Registrierung erfolgreich. Bitte prüfe deine Emails.',
      email, // Für Redirect zur Verify-Seite
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    )
  }
}
