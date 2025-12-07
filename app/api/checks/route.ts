
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { calculateOverallScore, calculateRiskLevel, generateRecommendations } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

// Validation Schema
const createCheckSchema = z.object({
  answers: z.record(z.string(), z.any())
})

// POST - Create new check
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = createCheckSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { answers } = result.data

    // Calculate scores and risk
    const scores = calculateOverallScore(answers)
    const riskLevel = calculateRiskLevel(scores.overallScore, answers)
    const recommendations = generateRecommendations(answers, riskLevel)

    // Create check
    const check = await prisma.complianceCheck.create({
      data: {
        userId: session.user.id,
        answers,
        overallScore: scores.overallScore,
        documentationScore: scores.documentationScore,
        technicalScore: scores.technicalScore,
        governanceScore: scores.governanceScore,
        riskLevel: riskLevel,
        recommendations: recommendations as any,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    return NextResponse.json(check)
  } catch (error) {
    console.error('Create check error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET - List checks
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks = await prisma.complianceCheck.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(checks)
}


