import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { calculateOverallScore, calculateRiskLevel, generateRecommendations } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1),
  company: z.string().min(1),
  checkAnswers: z.record(z.string(), z.any()).optional(), // Optional answers from landing page test
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
      console.error('Validation error:', result.error.flatten())
      return NextResponse.json(
        { 
          error: 'Ungültige Eingaben',
          details: result.error.flatten()
        },
        { status: 400 }
      )
    }

    const { email, password, name, company, checkAnswers } = result.data

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
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        company,
        verificationToken: verificationCode,
        verificationTokenExpiry,
      },
    })

    // Wenn Check-Antworten vorhanden sind, erstelle den Check
    let checkId = null
    if (checkAnswers) {
      const scores = calculateOverallScore(checkAnswers)
      const riskLevel = calculateRiskLevel(scores.overallScore, checkAnswers)
      const recommendations = generateRecommendations(checkAnswers, riskLevel)

      const check = await prisma.complianceCheck.create({
        data: {
          userId: user.id,
          answers: checkAnswers,
          overallScore: scores.overallScore,
          documentationScore: scores.documentationScore,
          technicalScore: scores.technicalScore,
          governanceScore: scores.governanceScore,
          riskLevel: riskLevel,
          recommendations: recommendations as any, // Cast to any for Json type
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
      checkId = check.id
    }

    // Email senden
    const emailResult = await sendVerificationEmail(email, verificationCode, name)

    if (!emailResult.success) {
      return NextResponse.json(
        { 
          error: 'Email konnte nicht gesendet werden. Bitte überprüfen Sie, ob Ihre Email-Adresse für den Versand freigeschaltet ist (Resend Sandbox).',
          details: emailResult.error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Registrierung erfolgreich. Bitte prüfe deine Emails.',
      email, // Für Redirect zur Verify-Seite
      checkId // Optional: ID des erstellten Checks
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    )
  }
}
