import { NextResponse } from 'next/server'
import { searchStations } from '@/lib/spritpreis/tankerkoenig'
import { getCoordinatesForPLZ, isValidPLZ } from '@/lib/spritpreis/plz-geocoder'
import type { FuelType } from '@/lib/spritpreis/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const plz = searchParams.get('plz')
    const fuelType = (searchParams.get('type') || 'e10') as FuelType
    const radius = parseInt(searchParams.get('radius') || '5', 10)

    if (!plz || !isValidPLZ(plz)) {
      return NextResponse.json(
        { error: 'Ungültige PLZ. Bitte eine 5-stellige deutsche Postleitzahl angeben.' },
        { status: 400 }
      )
    }

    if (!['e5', 'e10', 'diesel'].includes(fuelType)) {
      return NextResponse.json(
        { error: 'Ungültiger Kraftstofftyp. Erlaubt: e5, e10, diesel' },
        { status: 400 }
      )
    }

    const clampedRadius = Math.max(1, Math.min(25, radius))

    // Geocode PLZ to coordinates
    const coords = await getCoordinatesForPLZ(plz)
    if (!coords) {
      return NextResponse.json(
        { error: 'PLZ konnte nicht gefunden werden.' },
        { status: 404 }
      )
    }

    // Search stations via Tankerkönig API
    const result = await searchStations(coords.lat, coords.lng, clampedRadius, fuelType)

    return NextResponse.json({
      ok: true,
      plz,
      fuelType,
      radius: clampedRadius,
      coordinates: coords,
      ...result,
    })
  } catch (error) {
    console.error('Spritpreis search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler bei der Suche' },
      { status: 500 }
    )
  }
}
