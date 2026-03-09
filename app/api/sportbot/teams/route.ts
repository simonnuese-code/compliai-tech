import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

/** GET /api/sportbot/teams — Get user's followed teams */
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teams = await prisma.followedTeam.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ teams })
}

/** POST /api/sportbot/teams — Follow a team */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { teamId, teamName, teamCrest, teamShortName, leagueCode, leagueName, leagueEmblem } = body

  if (!teamId || !teamName || !leagueCode || !leagueName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const team = await prisma.followedTeam.upsert({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: Number(teamId),
        },
      },
      update: {
        teamName,
        teamCrest,
        teamShortName,
        leagueCode,
        leagueName,
        leagueEmblem,
      },
      create: {
        userId: session.user.id,
        teamId: Number(teamId),
        teamName,
        teamCrest,
        teamShortName,
        leagueCode,
        leagueName,
        leagueEmblem,
      },
    })

    // Also ensure SportBotSettings exist
    await prisma.sportBotSettings.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    })

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error following team:', error)
    return NextResponse.json({ error: 'Failed to follow team' }, { status: 500 })
  }
}

/** DELETE /api/sportbot/teams — Unfollow a team */
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })
  }

  await prisma.followedTeam.deleteMany({
    where: {
      userId: session.user.id,
      teamId: Number(teamId),
    },
  })

  return NextResponse.json({ success: true })
}
