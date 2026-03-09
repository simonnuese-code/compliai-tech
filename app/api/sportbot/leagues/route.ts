import { NextResponse } from 'next/server'
import { SUPPORTED_LEAGUES, getTeamsByCompetition } from '@/lib/sportbot/football-api'
import { getSession } from '@/lib/session'

/** GET /api/sportbot/leagues — List all supported leagues and their teams */
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return the list of supported leagues (no API call needed)
  return NextResponse.json({
    leagues: SUPPORTED_LEAGUES.map(l => ({
      code: l.code,
      name: l.name,
      country: l.country,
      flag: l.flag,
    })),
  })
}
