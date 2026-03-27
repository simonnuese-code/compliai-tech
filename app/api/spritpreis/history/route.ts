import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FuelType } from '@/lib/spritpreis/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const plz = searchParams.get('plz')
    const fuelType = (searchParams.get('type') || 'e10') as FuelType
    const period = searchParams.get('period') || '30' // days

    if (!plz) {
      return NextResponse.json(
        { error: 'PLZ ist erforderlich.' },
        { status: 400 }
      )
    }

    if (!['e5', 'e10', 'diesel'].includes(fuelType)) {
      return NextResponse.json(
        { error: 'Ungültiger Kraftstofftyp.' },
        { status: 400 }
      )
    }

    const days = Math.max(7, Math.min(365, parseInt(period, 10) || 30))
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    let snapshots: Array<{ date: Date; avgPrice: number; minPrice: number; maxPrice: number }> = []
    
    try {
      snapshots = await prisma.fuelPriceSnapshot.findMany({
        where: {
          postalCode: plz,
          fuelType,
          date: { gte: dateFrom },
        },
        orderBy: { date: 'asc' },
      })
    } catch {
      // Table might not exist yet (DB migration pending)
      // Return empty data gracefully
    }

    const points = snapshots.map((s: { date: Date; avgPrice: number; minPrice: number; maxPrice: number }) => ({
      date: s.date.toISOString().split('T')[0],
      avgPrice: s.avgPrice,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
    }))

    // Calculate trend
    let changePercent = 0
    let direction: 'up' | 'down' | 'stable' = 'stable'

    if (points.length >= 2) {
      const firstPrice = points[0].avgPrice
      const lastPrice = points[points.length - 1].avgPrice
      changePercent = ((lastPrice - firstPrice) / firstPrice) * 100

      if (changePercent > 0.5) direction = 'up'
      else if (changePercent < -0.5) direction = 'down'
      else direction = 'stable'
    }

    return NextResponse.json({
      ok: true,
      fuelType,
      postalCode: plz,
      period: days,
      points,
      trend: {
        changePercent: Math.round(changePercent * 10) / 10,
        direction,
      },
    })
  } catch (error) {
    console.error('Spritpreis history error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Preishistorie' },
      { status: 500 }
    )
  }
}
