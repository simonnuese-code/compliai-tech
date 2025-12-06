import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation Schema
const createCheckSchema = z.object({
  answers: z.record(z.any())
})

// POST - Create new check
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createCheckSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      )
    }

    const { answers } = result.data

    // TODO: Implement risk assessment logic
    const riskLevel = calculateRiskLevel(answers)
    const score = calculateScore(answers)

    // Create check
    const check = await prisma.complianceCheck.create({
      data: {
        userId: session.user.id,
        answers,
        status: 'COMPLETED',
        riskLevel,
        overallScore: score,
        completedAt: new Date()
      }
    })

    return NextResponse.json(check)
  } catch (error) {
    console.error('Create check error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// GET - List checks
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const checks = await prisma.complianceCheck.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(checks)
  } catch (error) {
    console.error('Get checks error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// Helper functions (Simplified Logic)
function calculateRiskLevel(answers: Record<string, any>): 'MINIMAL' | 'LIMITED' | 'HIGH' | 'UNACCEPTABLE' {
  // Simple logic: If personal data is sensitive -> HIGH, else LIMITED
  if (answers['personal_data'] === 'Ja, sensibel (Gesundheit, Biometrie)') {
    return 'HIGH'
  }
  return 'LIMITED'
}

function calculateScore(answers: Record<string, any>): number {
  // Random score for demo
  return Math.floor(Math.random() * 40) + 60 // 60-100
}
