export type FuelType = 'e5' | 'e10' | 'diesel'

export interface Station {
  id: string
  name: string
  brand: string
  street: string
  houseNumber: string
  postCode: string
  place: string
  lat: number
  lng: number
  dist: number
  price: number | null
  isOpen: boolean
  e5: number | null
  e10: number | null
  diesel: number | null
}

export interface SearchResult {
  stations: Station[]
  stats: PriceStats
}

export interface PriceStats {
  avgPrice: number
  minPrice: number
  maxPrice: number
  stationCount: number
  cheapestStation: string
  mostExpensiveStation: string
}

export interface PriceHistoryPoint {
  date: string
  avgPrice: number
  minPrice: number
  maxPrice: number
}

export interface PriceHistory {
  fuelType: FuelType
  postalCode: string
  points: PriceHistoryPoint[]
  trend: {
    changePercent: number
    direction: 'up' | 'down' | 'stable'
  }
}

export const FUEL_LABELS: Record<FuelType, string> = {
  e5: 'Super E5',
  e10: 'Super E10',
  diesel: 'Diesel',
}

export const FUEL_COLORS: Record<FuelType, string> = {
  e5: '#f97316',   // orange
  e10: '#06b6d4',  // cyan
  diesel: '#8b5cf6', // violet
}
