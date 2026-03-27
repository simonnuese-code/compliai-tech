'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Fuel,
  Search,
  Loader2,
  MapPin,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
  Star,
  ChevronDown,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ===== TYPES =====

type FuelType = 'e5' | 'e10' | 'diesel'

interface Station {
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

interface PriceStats {
  avgPrice: number
  minPrice: number
  maxPrice: number
  stationCount: number
  cheapestStation: string
  mostExpensiveStation: string
}

interface HistoryPoint {
  date: string
  avgPrice: number
  minPrice: number
  maxPrice: number
}

// ===== CONSTANTS =====

const FUEL_OPTIONS: { type: FuelType; label: string; color: string }[] = [
  { type: 'e5', label: 'Super E5', color: '#f97316' },
  { type: 'e10', label: 'Super E10', color: '#06b6d4' },
  { type: 'diesel', label: 'Diesel', color: '#8b5cf6' },
]

const RADIUS_OPTIONS = [1, 2, 5, 10, 15, 25]

const TIME_PERIODS = [
  { days: 7, label: '7T' },
  { days: 30, label: '30T' },
  { days: 90, label: '90T' },
  { days: 180, label: '6M' },
  { days: 365, label: '1J' },
]

// ===== HELPER FUNCTIONS =====

function getPriceColor(price: number, min: number, max: number): string {
  if (max === min) return 'text-emerald-400'
  const ratio = (price - min) / (max - min)
  if (ratio < 0.33) return 'text-emerald-400'
  if (ratio < 0.66) return 'text-amber-400'
  return 'text-rose-400'
}

function getPriceBgColor(price: number, min: number, max: number): string {
  if (max === min) return 'bg-emerald-500/20'
  const ratio = (price - min) / (max - min)
  if (ratio < 0.33) return 'bg-emerald-500/20'
  if (ratio < 0.66) return 'bg-amber-500/20'
  return 'bg-rose-500/20'
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return '–'
  return price.toFixed(3) + '€'
}

function getRankLabel(index: number, total: number): string {
  if (total <= 1) return ''
  return `#${index + 1} von ${total}`
}

// ===== COMPONENTS =====

function StationCard({
  station,
  index,
  total,
  fuelType,
  minPrice,
  maxPrice,
}: {
  station: Station
  index: number
  total: number
  fuelType: FuelType
  minPrice: number
  maxPrice: number
}) {
  const price = station[fuelType] ?? station.price ?? 0
  const isOpen = station.isOpen

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 ${
        index === 0
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {/* Cheapest badge */}
      {index === 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20">
          <Star className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">GÜNSTIGSTE</span>
        </div>
      )}

      {/* Station info row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white truncate">
            {station.brand || station.name}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {station.street} {station.houseNumber}, {station.postCode} {station.place}
          </p>
        </div>
      </div>

      {/* Price display */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className={`text-3xl font-bold tabular-nums ${getPriceColor(price, minPrice, maxPrice)}`}>
            {formatPrice(price)}
          </span>
          <span className="text-xs text-slate-500 ml-2">/Liter</span>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span>{station.dist.toFixed(1)} km</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {getRankLabel(index, total)}
          </div>
        </div>
      </div>

      {/* All prices row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        {station.e5 !== null && (
          <div className="text-xs">
            <span className="text-slate-500">E5: </span>
            <span className={`font-medium ${fuelType === 'e5' ? 'text-orange-400' : 'text-slate-400'}`}>
              {station.e5?.toFixed(3)}€
            </span>
          </div>
        )}
        {station.e10 !== null && (
          <div className="text-xs">
            <span className="text-slate-500">E10: </span>
            <span className={`font-medium ${fuelType === 'e10' ? 'text-cyan-400' : 'text-slate-400'}`}>
              {station.e10?.toFixed(3)}€
            </span>
          </div>
        )}
        {station.diesel !== null && (
          <div className="text-xs">
            <span className="text-slate-500">Diesel: </span>
            <span className={`font-medium ${fuelType === 'diesel' ? 'text-violet-400' : 'text-slate-400'}`}>
              {station.diesel?.toFixed(3)}€
            </span>
          </div>
        )}
        <div className="ml-auto">
          <span className={`text-xs font-medium ${isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isOpen ? '● Geöffnet' : '● Geschlossen'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
    </motion.div>
  )
}

// Custom Recharts Tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold text-white tabular-nums">{entry.value.toFixed(3)}€</span>
        </div>
      ))}
    </div>
  )
}

// ===== MAIN PAGE COMPONENT =====

export default function SpritpreisPage() {
  // Search state
  const [plz, setPlz] = useState('')
  const [fuelType, setFuelType] = useState<FuelType>('e10')
  const [radius, setRadius] = useState(5)
  const [showRadiusDropdown, setShowRadiusDropdown] = useState(false)

  // Results state
  const [stations, setStations] = useState<Station[]>([])
  const [stats, setStats] = useState<PriceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // History state
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([])
  const [historyFuelType, setHistoryFuelType] = useState<FuelType>('e10')
  const [historyPeriod, setHistoryPeriod] = useState(30)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTrend, setHistoryTrend] = useState<{ changePercent: number; direction: string } | null>(null)

  // Search function
  const handleSearch = useCallback(async () => {
    if (!plz || plz.length !== 5) {
      setError('Bitte eine 5-stellige PLZ eingeben')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/spritpreis/search?plz=${plz}&type=${fuelType}&radius=${radius}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Fehler bei der Suche')
        return
      }

      setStations(data.stations || [])
      setStats(data.stats || null)
      setHasSearched(true)

      // Also fetch history
      fetchHistory(plz, fuelType, historyPeriod)
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }, [plz, fuelType, radius, historyPeriod])

  // Fetch price history
  const fetchHistory = async (zip: string, fuel: FuelType, days: number) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/spritpreis/history?plz=${zip}&type=${fuel}&period=${days}`)
      const data = await res.json()
      if (res.ok) {
        setHistoryData(data.points || [])
        setHistoryTrend(data.trend || null)
      }
    } catch {
      console.error('History fetch failed')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Handle fuel type change in history
  const handleHistoryFuelChange = (newType: FuelType) => {
    setHistoryFuelType(newType)
    if (hasSearched && plz) {
      fetchHistory(plz, newType, historyPeriod)
    }
  }

  // Handle period change
  const handlePeriodChange = (days: number) => {
    setHistoryPeriod(days)
    if (hasSearched && plz) {
      fetchHistory(plz, historyFuelType, days)
    }
  }

  const fuelColor = FUEL_OPTIONS.find(f => f.type === fuelType)?.color || '#f97316'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Hub</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
              <Fuel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Spritpreis Tracker</h1>
              <p className="text-sm text-slate-500">Echtzeit-Kraftstoffpreise • Preisverlauf • Vergleich</p>
            </div>
          </div>
        </motion.div>

        {/* Search Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* PLZ Input */}
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-400 mb-2 block">Postleitzahl</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={plz}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                    setPlz(val)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="z.B. 10115"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/25 transition-colors text-sm"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Radius Dropdown */}
            <div className="relative w-full sm:w-32">
              <label className="text-xs font-medium text-slate-400 mb-2 block">Umkreis</label>
              <button
                onClick={() => setShowRadiusDropdown(!showRadiusDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 transition-colors"
              >
                <span>{radius} km</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              {showRadiusDropdown && (
                <div className="absolute top-full mt-1 w-full rounded-xl bg-slate-800 border border-white/10 shadow-xl z-20 overflow-hidden">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRadius(r)
                        setShowRadiusDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                        radius === r ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading || plz.length !== 5}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Suchen
              </button>
            </div>
          </div>

          {/* Fuel Type Toggle */}
          <div className="flex gap-1 mt-4 p-1 rounded-xl bg-white/5 border border-white/5">
            {FUEL_OPTIONS.map((fuel) => (
              <button
                key={fuel.type}
                onClick={() => setFuelType(fuel.type)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  fuelType === fuel.type
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="mr-1" style={{ color: fuelType === fuel.type ? fuel.color : undefined }}>●</span>
                {fuel.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {/* Stats Cards */}
            {stats && stats.stationCount > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <StatCard
                  label="Ø Preis"
                  value={formatPrice(stats.avgPrice)}
                  icon={BarChart3}
                  color="bg-orange-500/20"
                  delay={0}
                />
                <StatCard
                  label="Günstigste"
                  value={formatPrice(stats.minPrice)}
                  subtitle={stats.cheapestStation}
                  icon={TrendingDown}
                  color="bg-emerald-500/20"
                  delay={0.05}
                />
                <StatCard
                  label="Teuerste"
                  value={formatPrice(stats.maxPrice)}
                  subtitle={stats.mostExpensiveStation}
                  icon={TrendingUp}
                  color="bg-rose-500/20"
                  delay={0.1}
                />
                <StatCard
                  label="Tankstellen"
                  value={stats.stationCount.toString()}
                  subtitle={`im ${radius} km Umkreis`}
                  icon={MapPin}
                  color="bg-blue-500/20"
                  delay={0.15}
                />
              </div>
            )}

            {/* Station List */}
            {stations.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  {stations.length} Tankstellen gefunden
                </h2>
                <div className="space-y-3">
                  {stations.map((station, i) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      index={i}
                      total={stations.length}
                      fuelType={fuelType}
                      minPrice={stats?.minPrice || 0}
                      maxPrice={stats?.maxPrice || 0}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 mb-12"
              >
                <Fuel className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Keine Tankstellen im Umkreis gefunden.</p>
                <p className="text-slate-600 text-sm mt-1">Versuche einen größeren Umkreis oder eine andere PLZ.</p>
              </motion.div>
            )}

            {/* Price History Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Preisverlauf</h2>
                    <p className="text-xs text-slate-500">Durchschnittspreis im Umkreis PLZ {plz}</p>
                  </div>
                </div>

                {historyTrend && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    historyTrend.direction === 'down'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : historyTrend.direction === 'up'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {historyTrend.direction === 'down' ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : historyTrend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {historyTrend.changePercent > 0 ? '+' : ''}{historyTrend.changePercent}%
                  </div>
                )}
              </div>

              {/* Fuel Type Selector for History */}
              <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-white/5">
                {FUEL_OPTIONS.map((fuel) => (
                  <button
                    key={fuel.type}
                    onClick={() => handleHistoryFuelChange(fuel.type)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      historyFuelType === fuel.type
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {fuel.label}
                  </button>
                ))}
              </div>

              {/* Time Period Selector */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/5">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.days}
                    onClick={() => handlePeriodChange(period.days)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      historyPeriod === period.days
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {historyLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                </div>
              ) : historyData.length > 0 ? (
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={fuelColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={fuelColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="minGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        tickFormatter={(d: string) => {
                          const date = new Date(d)
                          return `${date.getDate()}.${date.getMonth() + 1}.`
                        }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v: number) => v.toFixed(2) + '€'}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgPrice"
                        name="Ø Preis"
                        stroke={fuelColor}
                        strokeWidth={2}
                        fill="url(#avgGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="minPrice"
                        name="Min. Preis"
                        stroke="#22c55e"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="url(#minGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="maxPrice"
                        name="Max. Preis"
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 mb-4">
                    <Clock className="h-7 w-7 text-orange-400" />
                  </div>
                  <p className="text-slate-400 font-medium mb-1">Noch keine historischen Daten</p>
                  <p className="text-slate-600 text-xs max-w-sm">
                    Die Datensammlung für diese PLZ wurde gestartet. Historische Preisdaten werden ab morgen hier angezeigt.
                  </p>
                </div>
              )}
            </motion.div>

            {/* API Attribution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-slate-600">
                Daten von{' '}
                <a
                  href="https://creativecommons.tankerkoenig.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400/60 hover:text-orange-400 transition-colors"
                >
                  tankerkoenig.de
                </a>
                {' '}• CC BY 4.0 • Quelle: MTS-K
              </p>
            </motion.div>
          </>
        )}

        {/* Initial empty state */}
        {!loading && !hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/20 mb-6">
              <Fuel className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Kraftstoffpreise vergleichen</h2>
            <p className="text-slate-400 mb-2 max-w-md mx-auto">
              Gib deine Postleitzahl ein und finde die günstigste Tankstelle in deiner Nähe.
            </p>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Echtzeit-Preise für Super E5, Super E10 und Diesel aus der Markttransparenzstelle für Kraftstoffe.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
