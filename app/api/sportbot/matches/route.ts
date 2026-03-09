import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { getUpcomingMatchesForTeams, getLiveMatches } from '@/lib/sportbot/football-api'

/** GET /api/sportbot/matches — Get matches for user's followed teams */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'upcoming' // 'upcoming' | 'live' | 'recent'

  // Get user's followed team IDs
  const followedTeams = await prisma.followedTeam.findMany({
    where: { userId: session.user.id },
    select: { teamId: true },
  })

  const teamIds = followedTeams.map(t => t.teamId)

  if (teamIds.length === 0) {
    return NextResponse.json({ matches: [], message: 'No teams followed yet' })
  }

  // Check if we have cached matches in DB first
  if (filter === 'live') {
    // For live matches, try API directly
    const liveResult = await getLiveMatches()
    if (liveResult.data) {
      const relevantMatches = liveResult.data.matches.filter(m =>
        teamIds.includes(m.homeTeam.id) || teamIds.includes(m.awayTeam.id)
      )
      return NextResponse.json({ matches: relevantMatches })
    }
    // Fallback to DB
    const dbMatches = await prisma.sportMatch.findMany({
      where: {
        status: { in: ['IN_PLAY', 'PAUSED'] },
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
      include: { events: { orderBy: { minute: 'desc' } } },
      orderBy: { utcDate: 'asc' },
    })
    return NextResponse.json({ matches: dbMatches, source: 'cache' })
  }

  if (filter === 'recent') {
    // Get finished matches from last 7 days from DB
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const dbMatches = await prisma.sportMatch.findMany({
      where: {
        status: 'FINISHED',
        utcDate: { gte: sevenDaysAgo },
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
      include: { events: { orderBy: { minute: 'asc' } } },
      orderBy: { utcDate: 'desc' },
      take: 20,
    })
    return NextResponse.json({ matches: dbMatches })
  }

  // Upcoming matches (next 10 days)
  const result = await getUpcomingMatchesForTeams(teamIds, 10)
  if (result.error) {
    // Fallback to DB cache
    const dbMatches = await prisma.sportMatch.findMany({
      where: {
        status: { in: ['SCHEDULED', 'TIMED'] },
        utcDate: { gte: new Date() },
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
      orderBy: { utcDate: 'asc' },
      take: 20,
    })
    return NextResponse.json({ matches: dbMatches, source: 'cache' })
  }

  return NextResponse.json({ matches: result.data?.matches || [] })
}
