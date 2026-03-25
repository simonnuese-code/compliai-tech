'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Trophy,
  Plus,
  Loader2,
  Calendar,
  Clock,
  Radio,
  ChevronRight,
  Settings,
  Bell,
  Smartphone,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface FollowedTeam {
  id: string
  teamId: number
  teamName: string
  teamCrest: string | null
  teamShortName: string | null
  leagueCode: string
  leagueName: string
  leagueEmblem: string | null
}

interface ValueBetMatch {
  match: {
    externalId: number
    homeTeamName: string
    awayTeamName: string
    homeTeamCrest: string | null
    awayTeamCrest: string | null
    competitionName: string
    competitionEmblem: string | null
    utcDate: string
    status: string
  }
  prediction: {
    homeWinProb: number
    drawProb: number
    awayWinProb: number
    overProb: number
    underProb: number
    expectedHomeGoals: number
    expectedAwayGoals: number
    bestValueMarket: string | null
    bestValueEV: number | null
    bestValueOdds: number | null
    bestValueBookmaker: string | null
    kellyStake: number | null
    confidence: number
    modelVersion?: string
    eloHomeRating?: number | null
    eloAwayRating?: number | null
    restDaysHome?: number | null
    restDaysAway?: number | null
    h2hAdjustment?: number | null
    blendedHomeProb?: number | null
    blendedDrawProb?: number | null
    blendedAwayProb?: number | null
  } | null
  odds: Array<{
    bookmaker: string
    homeOdds: number
    drawOdds: number
    awayOdds: number
    overOdds: number | null
    underOdds: number | null
  }>
}

interface Match {
  id?: number
  externalId?: number
  homeTeam?: { id: number; name: string; shortName: string; crest: string }
  awayTeam?: { id: number; name: string; shortName: string; crest: string }
  homeTeamName?: string
  awayTeamName?: string
  homeTeamCrest?: string
  awayTeamCrest?: string
  homeTeamId?: number
  awayTeamId?: number
  competition?: { name: string; emblem: string; code: string }
  competitionName?: string
  competitionEmblem?: string
  score?: {
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
  homeScoreFullTime?: number | null
  awayScoreFullTime?: number | null
  utcDate?: string
  status: string
  matchday?: number | null
}

function getMatchTeams(match: Match) {
  return {
    homeName: match.homeTeam?.shortName || match.homeTeam?.name || match.homeTeamName || '–',
    awayName: match.awayTeam?.shortName || match.awayTeam?.name || match.awayTeamName || '–',
    homeCrest: match.homeTeam?.crest || match.homeTeamCrest || '',
    awayCrest: match.awayTeam?.crest || match.awayTeamCrest || '',
    homeScore: match.score?.fullTime?.home ?? match.homeScoreFullTime ?? null,
    awayScore: match.score?.fullTime?.away ?? match.awayScoreFullTime ?? null,
    competition: match.competition?.name || match.competitionName || '',
    competitionEmblem: match.competition?.emblem || match.competitionEmblem || '',
    date: match.utcDate ? new Date(match.utcDate) : null,
  }
}

function formatMatchDate(date: Date) {
  const now = new Date()
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Morgen'
  if (diffDays === -1) return 'Gestern'
  
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function formatMatchTime(date: Date) {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function MatchCard({ match, isLive }: { match: Match; isLive?: boolean }) {
  const m = getMatchTeams(match)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 ${
        isLive 
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
        </div>
      )}
      
      {/* Competition badge */}
      <div className="flex items-center gap-2 mb-4">
        {m.competitionEmblem && (
          <Image src={m.competitionEmblem} alt="" width={16} height={16} className="rounded-sm" unoptimized />
        )}
        <span className="text-xs text-slate-500 font-medium">{m.competition}</span>
        {match.matchday && <span className="text-xs text-slate-600">• Spieltag {match.matchday}</span>}
      </div>
      
      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {m.homeCrest && (
            <Image src={m.homeCrest} alt="" width={36} height={36} className="rounded-lg flex-shrink-0" unoptimized />
          )}
          <span className="text-sm font-semibold text-white truncate">{m.homeName}</span>
        </div>
        
        {/* Score / Time */}
        <div className="flex-shrink-0 text-center min-w-[80px]">
          {match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED' ? (
            <div className={`text-2xl font-bold tabular-nums ${isLive ? 'text-emerald-400' : 'text-white'}`}>
              {m.homeScore ?? '–'} : {m.awayScore ?? '–'}
            </div>
          ) : m.date ? (
            <div>
              <div className="text-xs text-slate-500 font-medium">{formatMatchDate(m.date)}</div>
              <div className="text-lg font-bold text-white tabular-nums">{formatMatchTime(m.date)}</div>
            </div>
          ) : (
            <span className="text-slate-500">–</span>
          )}
          {match.status === 'PAUSED' && (
            <span className="text-xs text-amber-400 font-medium">Halbzeit</span>
          )}
        </div>
        
        {/* Away */}
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold text-white truncate text-right">{m.awayName}</span>
          {m.awayCrest && (
            <Image src={m.awayCrest} alt="" width={36} height={36} className="rounded-lg flex-shrink-0" unoptimized />
          )}
        </div>
      </div>
      
      {/* Status */}
      {match.status === 'FINISHED' && (
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-600 font-medium">Beendet</span>
        </div>
      )}
    </motion.div>
  )
}

const MARKET_LABELS: Record<string, string> = {
  home: 'Heimsieg (1)',
  draw: 'Unentschieden (X)',
  away: 'Auswärtssieg (2)',
  over25: 'Über 2.5 Tore',
  under25: 'Unter 2.5 Tore',
}

function ValueBetCard({ data }: { data: ValueBetMatch }) {
  const { match, prediction, odds } = data
  const d = new Date(match.utcDate)
  const hasValue = prediction?.bestValueMarket && (prediction?.bestValueEV ?? 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 ${
        hasValue
          ? 'border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {hasValue && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20">
          <TrendingUp className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-bold text-amber-400">VALUE</span>
        </div>
      )}

      {/* Competition */}
      <div className="flex items-center gap-2 mb-3">
        {match.competitionEmblem && (
          <Image src={match.competitionEmblem} alt="" width={16} height={16} className="rounded-sm" unoptimized />
        )}
        <span className="text-xs text-slate-500 font-medium">{match.competitionName}</span>
        <span className="text-xs text-slate-600">• {formatMatchDate(d)} {formatMatchTime(d)}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {match.homeTeamCrest && (
            <Image src={match.homeTeamCrest} alt="" width={32} height={32} className="rounded-lg flex-shrink-0" unoptimized />
          )}
          <span className="text-sm font-semibold text-white truncate">{match.homeTeamName}</span>
        </div>
        <span className="text-slate-500 text-sm font-medium">vs</span>
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold text-white truncate text-right">{match.awayTeamName}</span>
          {match.awayTeamCrest && (
            <Image src={match.awayTeamCrest} alt="" width={32} height={32} className="rounded-lg flex-shrink-0" unoptimized />
          )}
        </div>
      </div>

      {prediction ? (
        <>
          {/* Probability bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-400">{(prediction.homeWinProb * 100).toFixed(0)}%</span>
              <span className="text-slate-400">{(prediction.drawProb * 100).toFixed(0)}%</span>
              <span className="text-blue-400">{(prediction.awayWinProb * 100).toFixed(0)}%</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
              <div className="bg-emerald-500" style={{ width: `${prediction.homeWinProb * 100}%` }} />
              <div className="bg-slate-500" style={{ width: `${prediction.drawProb * 100}%` }} />
              <div className="bg-blue-500" style={{ width: `${prediction.awayWinProb * 100}%` }} />
            </div>
          </div>

          {/* xG + Confidence */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">xG</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {prediction.expectedHomeGoals.toFixed(1)} - {prediction.expectedAwayGoals.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Konfidenz</span>
              <div className="flex gap-0.5">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold) => (
                  <div
                    key={threshold}
                    className={`h-2 w-2 rounded-full ${
                      prediction.confidence >= threshold
                        ? prediction.confidence >= 0.7 ? 'bg-emerald-500' : prediction.confidence >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${
                prediction.confidence >= 0.7 ? 'text-emerald-400' : prediction.confidence >= 0.4 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {(prediction.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Model Factors (v3 Pro) */}
          {prediction.eloHomeRating && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {/* ELO */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">ELO</span>
                <span className={`font-medium tabular-nums ${(prediction.eloHomeRating ?? 1500) >= 1600 ? 'text-emerald-400' : (prediction.eloHomeRating ?? 1500) >= 1450 ? 'text-slate-300' : 'text-red-400'}`}>
                  {Math.round(prediction.eloHomeRating ?? 1500)}
                </span>
                <span className="text-slate-600">vs</span>
                <span className={`font-medium tabular-nums ${(prediction.eloAwayRating ?? 1500) >= 1600 ? 'text-emerald-400' : (prediction.eloAwayRating ?? 1500) >= 1450 ? 'text-slate-300' : 'text-red-400'}`}>
                  {Math.round(prediction.eloAwayRating ?? 1500)}
                </span>
              </div>
              {/* Rest Days */}
              {(prediction.restDaysHome !== null || prediction.restDaysAway !== null) && (
                <div className="flex items-center gap-1.5 text-xs justify-end">
                  <span className="text-slate-500">Ruhetage</span>
                  <span className={`font-medium ${(prediction.restDaysHome ?? 5) <= 3 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {prediction.restDaysHome ?? '?'}d
                  </span>
                  <span className="text-slate-600">vs</span>
                  <span className={`font-medium ${(prediction.restDaysAway ?? 5) <= 3 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {prediction.restDaysAway ?? '?'}d
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Model version badge */}
          {prediction.modelVersion && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                {prediction.modelVersion === 'poisson_v3_pro' ? 'v3 Pro · 7 Faktoren' : prediction.modelVersion}
              </span>
              {prediction.h2hAdjustment && prediction.h2hAdjustment > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  H2H
                </span>
              )}
            </div>
          )}

          {/* Low confidence warning */}
          {prediction.confidence < 0.5 && (
            <div className="mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
              <span className="text-xs text-amber-400/70">Wenig Saisondaten — Vorhersage unsicher</span>
            </div>
          )}

          {/* Value bet recommendation */}
          {hasValue && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-amber-300">
                  {MARKET_LABELS[prediction.bestValueMarket!] || prediction.bestValueMarket}
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  EV +{((prediction.bestValueEV ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>@ {prediction.bestValueOdds?.toFixed(2)} ({prediction.bestValueBookmaker})</span>
                {prediction.kellyStake && (
                  <span>Kelly: {(prediction.kellyStake * 100).toFixed(1)}%</span>
                )}
              </div>
            </div>
          )}

          {/* Odds comparison (collapsed) */}
          {odds.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                {odds.length} Buchmacher vergleichen
              </summary>
              <div className="mt-2 space-y-1">
                {odds.slice(0, 5).map((o, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[100px]">{o.bookmaker}</span>
                    <div className="flex gap-3 tabular-nums">
                      <span className="text-slate-300">{o.homeOdds.toFixed(2)}</span>
                      <span className="text-slate-300">{o.drawOdds.toFixed(2)}</span>
                      <span className="text-slate-300">{o.awayOdds.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="text-center py-2">
          <span className="text-xs text-slate-500">Analyse wird geladen...</span>
        </div>
      )}
    </motion.div>
  )
}

function TeamBadge({ team, onRemove }: { team: FollowedTeam; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 hover:border-white/20 transition-all"
    >
      {team.teamCrest && (
        <Image src={team.teamCrest} alt="" width={28} height={28} className="rounded-lg" unoptimized />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{team.teamName}</p>
        <p className="text-xs text-slate-500">{team.leagueName}</p>
      </div>
      <button 
        onClick={onRemove}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 text-lg leading-none"
        title="Entfernen"
      >
        ×
      </button>
    </motion.div>
  )
}

export default function SportBotPage() {
  const [followedTeams, setFollowedTeams] = useState<FollowedTeam[]>([])
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [valueBets, setValueBets] = useState<ValueBetMatch[]>([])
  const [modelPerformance, setModelPerformance] = useState<{ avgBrierScore: number | null; matchesScored: number }>({ avgBrierScore: null, matchesScored: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'recent' | 'value'>('upcoming')

  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, upcomingRes, recentRes, valueBetsRes] = await Promise.all([
        fetch('/api/sportbot/teams'),
        fetch('/api/sportbot/matches?filter=upcoming'),
        fetch('/api/sportbot/matches?filter=recent'),
        fetch('/api/sportbot/value-bets'),
      ])

      if (teamsRes.ok) {
        const data = await teamsRes.json()
        setFollowedTeams(data.teams)
      }
      if (upcomingRes.ok) {
        const data = await upcomingRes.json()
        setUpcomingMatches(data.matches || [])
      }
      if (recentRes.ok) {
        const data = await recentRes.json()
        setRecentMatches(data.matches || [])
      }
      if (valueBetsRes.ok) {
        const data = await valueBetsRes.json()
        setValueBets(data.matches || [])
        if (data.modelPerformance) setModelPerformance(data.modelPerformance)
      }
    } catch (err) {
      console.error('Failed to fetch sport data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/sportbot/matches?filter=live')
      if (res.ok) {
        const data = await res.json()
        setLiveMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Failed to fetch live matches:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchLive()
    // Poll live matches every 30 seconds
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [fetchData, fetchLive])

  const handleUnfollow = async (teamId: number) => {
    await fetch(`/api/sportbot/teams?teamId=${teamId}`, { method: 'DELETE' })
    setFollowedTeams(prev => prev.filter(t => t.teamId !== teamId))
  }

  const valueBetCount = valueBets.filter(v => v.prediction?.bestValueMarket && (v.prediction?.bestValueEV ?? 0) > 0).length

  const tabs = [
    { id: 'live' as const, label: 'Live', icon: Radio, count: liveMatches.length },
    { id: 'upcoming' as const, label: 'Kommend', icon: Calendar, count: upcomingMatches.length },
    { id: 'recent' as const, label: 'Ergebnisse', icon: Clock, count: recentMatches.length },
    { id: 'value' as const, label: 'Value Bets', icon: TrendingUp, count: valueBetCount },
  ]

  const currentMatches = activeTab === 'live' ? liveMatches : activeTab === 'upcoming' ? upcomingMatches : activeTab === 'recent' ? recentMatches : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-green-500/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/hub/sportbot/teams"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Teams
            </Link>
            <Link
              href="/hub/sportbot/settings"
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <Settings className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
            </Link>
          </div>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sport-Bot</h1>
              <p className="text-sm text-slate-500">Live-Updates • Ergebnisse • WhatsApp-Benachrichtigungen</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : followedTeams.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/20 mb-6">
              <Star className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Noch keine Teams verfolgt</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Wähle deine Lieblingsteams aus und erhalte Live-Updates, Ergebnisse und WhatsApp-Benachrichtigungen.
            </p>
            <Link
              href="/hub/sportbot/teams"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Plus className="h-5 w-5" />
              Teams auswählen
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Followed Teams Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Meine Teams</h2>
                <Link href="/hub/sportbot/teams" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                  Bearbeiten <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <AnimatePresence>
                  {followedTeams.map(team => (
                    <TeamBadge key={team.id} team={team} onRemove={() => handleUnfollow(team.teamId)} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Live Match Banner */}
            {liveMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">{liveMatches.length} Spiel{liveMatches.length > 1 ? 'e' : ''} LIVE</span>
                </div>
                <div className="space-y-3">
                  {liveMatches.map((match, i) => (
                    <MatchCard key={match.id || i} match={match} isLive />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-white/5 border border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Match List / Value Bets */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {activeTab === 'value' ? (
                  <motion.div
                    key="value"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {valueBets.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-500">Noch keine Analysen verfügbar. Quoten werden alle 2 Stunden aktualisiert.</p>
                      </div>
                    ) : (
                      <>
                        {valueBets.map((vb, i) => (
                          <ValueBetCard key={vb.match.externalId || i} data={vb} />
                        ))}
                        {/* Model info footer */}
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                              Poisson v3 Pro
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                            7 Faktoren: Dixon-Coles · ELO Rating · Markt-Blend · Ruhetage · H2H · Regression · Form
                          </p>
                          {modelPerformance.matchesScored > 0 && (
                            <p className="text-xs text-slate-500 text-center mt-1.5">
                              Genauigkeit: <span className="text-slate-300 font-medium">
                                {((modelPerformance.avgBrierScore ?? 0) * 100).toFixed(1)} Brier
                              </span> ({modelPerformance.matchesScored} ausgewertet)
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : currentMatches.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <p className="text-slate-500">
                      {activeTab === 'live'
                        ? 'Aktuell läuft kein Spiel deiner Teams.'
                        : activeTab === 'upcoming'
                        ? 'Keine anstehenden Spiele in den nächsten 10 Tagen.'
                        : 'Keine kürzlichen Ergebnisse.'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {currentMatches.map((match, i) => (
                      <MatchCard key={match.id || i} match={match} isLive={activeTab === 'live'} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* WhatsApp Connection Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-5 rounded-2xl border border-white/5 bg-white/[0.02]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <Smartphone className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">WhatsApp-Benachrichtigungen</p>
                <p className="text-xs text-slate-500">Erhalte Live-Updates direkt auf dein Handy</p>
              </div>
            </div>
            <Link
              href="/hub/sportbot/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Bell className="h-4 w-4" />
              Einrichten
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
