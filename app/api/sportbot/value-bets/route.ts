import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

/** GET /api/sportbot/value-bets — Get upcoming value bets for followed teams */
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const followed = await prisma.followedTeam.findMany({
    where: { userId: session.user.id },
    select: { teamId: true },
  })
  const teamIds = followed.map(t => t.teamId)

  if (teamIds.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  // Get upcoming matches with predictions
  const matches = await prisma.sportMatch.findMany({
    where: {
      status: { in: ['SCHEDULED', 'TIMED'] },
      utcDate: { gte: new Date(), lte: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    orderBy: { utcDate: 'asc' },
  })

  // Fetch predictions and odds for each match
  const results = await Promise.all(
    matches.map(async (match) => {
      const prediction = await prisma.matchPrediction.findUnique({
        where: { matchExternalId: match.externalId },
      })
      const odds = await prisma.matchOdds.findMany({
        where: { matchExternalId: match.externalId },
      })

      return {
        match: {
          externalId: match.externalId,
          homeTeamName: match.homeTeamName,
          awayTeamName: match.awayTeamName,
          homeTeamCrest: match.homeTeamCrest,
          awayTeamCrest: match.awayTeamCrest,
          competitionName: match.competitionName,
          competitionEmblem: match.competitionEmblem,
          utcDate: match.utcDate,
          status: match.status,
        },
        prediction: prediction ? {
          homeWinProb: prediction.homeWinProb,
          drawProb: prediction.drawProb,
          awayWinProb: prediction.awayWinProb,
          overProb: prediction.overProb,
          underProb: prediction.underProb,
          expectedHomeGoals: prediction.expectedHomeGoals,
          expectedAwayGoals: prediction.expectedAwayGoals,
          bestValueMarket: prediction.bestValueMarket,
          bestValueEV: prediction.bestValueEV,
          bestValueOdds: prediction.bestValueOdds,
          bestValueBookmaker: prediction.bestValueBookmaker,
          kellyStake: prediction.kellyStake,
          confidence: prediction.confidence,
        } : null,
        odds: odds.map(o => ({
          bookmaker: o.bookmaker,
          homeOdds: o.homeOdds,
          drawOdds: o.drawOdds,
          awayOdds: o.awayOdds,
          overOdds: o.overUnder25Home,
          underOdds: o.overUnder25Away,
        })),
      }
    })
  )

  // Model performance
  const performance = await prisma.matchPrediction.aggregate({
    where: { brierScore: { not: null } },
    _avg: { brierScore: true },
    _count: true,
  })

  return NextResponse.json({
    matches: results,
    modelPerformance: {
      avgBrierScore: performance._avg.brierScore,
      matchesScored: performance._count,
    },
  })
}
