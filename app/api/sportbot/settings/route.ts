import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

/** GET /api/sportbot/settings — Get user's sport bot settings */
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let settings = await prisma.sportBotSettings.findUnique({
    where: { userId: session.user.id },
  })

  if (!settings) {
    settings = await prisma.sportBotSettings.create({
      data: { userId: session.user.id },
    })
  }

  const whatsapp = await prisma.whatsAppSession.findUnique({
    where: { userId: session.user.id },
    select: { status: true, phoneNumber: true, lastSeenAt: true },
  })

  return NextResponse.json({ settings, whatsapp })
}

/** PUT /api/sportbot/settings — Update settings */
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    preMatchMinutes,
    notificationsEnabled,
    quietHoursStart,
    quietHoursEnd,
    timezone,
  } = body

  const settings = await prisma.sportBotSettings.upsert({
    where: { userId: session.user.id },
    update: {
      ...(preMatchMinutes !== undefined && { preMatchMinutes }),
      ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      ...(quietHoursStart !== undefined && { quietHoursStart }),
      ...(quietHoursEnd !== undefined && { quietHoursEnd }),
      ...(timezone !== undefined && { timezone }),
    },
    create: {
      userId: session.user.id,
      preMatchMinutes: preMatchMinutes ?? 15,
      notificationsEnabled: notificationsEnabled ?? true,
      quietHoursStart,
      quietHoursEnd,
      timezone: timezone ?? 'Europe/Berlin',
    },
  })

  return NextResponse.json({ settings })
}
