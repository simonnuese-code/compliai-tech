/**
 * Tankerkönig API Client
 * ======================
 * Fetches fuel prices from the Tankerkönig API (CC BY 4.0)
 * Data source: Markttransparenzstelle für Kraftstoffe (MTS-K)
 *
 * Rate limit: max 1 request per 5 minutes
 * API docs: https://creativecommons.tankerkoenig.de
 */

import type { FuelType, Station, SearchResult, PriceStats } from './types'

const TANKERKOENIG_BASE = 'https://creativecommons.tankerkoenig.de'

// In-memory cache with 5-minute TTL (API rate limit)
interface CacheEntry {
  data: SearchResult
  timestamp: number
}

const searchCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(lat: number, lng: number, rad: number, type: FuelType): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${rad}_${type}`
}

/**
 * Search for gas stations near coordinates
 */
export async function searchStations(
  lat: number,
  lng: number,
  radius: number = 5,
  fuelType: FuelType = 'e10'
): Promise<SearchResult> {
  const apiKey = process.env.TANKERKOENIG_API_KEY
  if (!apiKey) {
    throw new Error('TANKERKOENIG_API_KEY not configured')
  }

  // Check cache
  const cacheKey = getCacheKey(lat, lng, radius, fuelType)
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const url = `${TANKERKOENIG_BASE}/json/list.php?lat=${lat}&lng=${lng}&rad=${radius}&sort=price&type=${fuelType}&apikey=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Tankerkönig API error: ${res.status}`)
  }

  const data = await res.json()

  if (!data.ok) {
    throw new Error(`Tankerkönig API: ${data.message || 'Unknown error'}`)
  }

  const stations: Station[] = (data.stations || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    brand: s.brand as string,
    street: s.street as string,
    houseNumber: (s.houseNumber || s.housNumber || '') as string,
    postCode: (s.postCode || s.post_code || '') as string,
    place: s.place as string,
    lat: s.lat as number,
    lng: s.lng as number,
    dist: s.dist as number,
    price: s.price as number | null,
    isOpen: s.isOpen as boolean,
    e5: s.e5 as number | null,
    e10: s.e10 as number | null,
    diesel: s.diesel as number | null,
  }))

  // Filter to only open stations with valid prices for the selected fuel type
  const openStations = stations.filter(s => s.isOpen && s.price !== null && s.price > 0)

  // Calculate stats
  const stats = calculateStats(openStations, fuelType)

  const result: SearchResult = { stations: openStations, stats }

  // Cache the result
  searchCache.set(cacheKey, { data: result, timestamp: Date.now() })

  return result
}

/**
 * Get details for a specific station
 */
export async function getStationDetail(stationId: string) {
  const apiKey = process.env.TANKERKOENIG_API_KEY
  if (!apiKey) {
    throw new Error('TANKERKOENIG_API_KEY not configured')
  }

  const url = `${TANKERKOENIG_BASE}/json/detail.php?id=${stationId}&apikey=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Tankerkönig API error: ${res.status}`)
  }

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Tankerkönig API: ${data.message || 'Unknown error'}`)
  }

  return data.station
}

/**
 * Calculate price statistics for a list of stations
 */
function calculateStats(stations: Station[], fuelType: FuelType): PriceStats {
  if (stations.length === 0) {
    return {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      stationCount: 0,
      cheapestStation: '-',
      mostExpensiveStation: '-',
    }
  }

  const prices = stations
    .map(s => {
      const price = s[fuelType] ?? s.price
      return price
    })
    .filter((p): p is number => p !== null && p > 0)

  if (prices.length === 0) {
    return {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      stationCount: stations.length,
      cheapestStation: '-',
      mostExpensiveStation: '-',
    }
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length

  const cheapest = stations.find(s => (s[fuelType] ?? s.price) === minPrice)
  const expensive = stations.find(s => (s[fuelType] ?? s.price) === maxPrice)

  return {
    avgPrice: Math.round(avgPrice * 1000) / 1000,
    minPrice,
    maxPrice,
    stationCount: stations.length,
    cheapestStation: cheapest?.brand || cheapest?.name || '-',
    mostExpensiveStation: expensive?.brand || expensive?.name || '-',
  }
}
