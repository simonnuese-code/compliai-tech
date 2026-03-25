import { NextRequest, NextResponse } from 'next/server'
import { getTeamsByCompetition } from '@/lib/sportbot/football-api'
import { getSession } from '@/lib/session'

/** GET /api/sportbot/leagues/[code]/teams — Get teams for a league */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await params

  const result = await getTeamsByCompetition(code)

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.rateLimited ? 429 : 500 }
    )
  }

  const teams = result.data?.teams.map(t => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName || '',
    tla: t.tla || '',
    crest: t.crest || '',
  })) || []

  return NextResponse.json({ teams })
}
