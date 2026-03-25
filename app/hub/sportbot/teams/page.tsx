'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Search,
  Check,
  Loader2,
  X,
  ChevronDown,
  Shield,
} from 'lucide-react'

interface League {
  code: string
  name: string
  country: string
  flag: string
  type?: 'league' | 'international'
}

interface Team {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

interface FollowedTeam {
  teamId: number
  teamName: string
  leagueCode: string
}

export default function TeamSelectionPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [followedTeams, setFollowedTeams] = useState<FollowedTeam[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingLeagues, setLoadingLeagues] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [savingTeam, setSavingTeam] = useState<number | null>(null)

  // Fetch leagues and followed teams
  useEffect(() => {
    async function init() {
      try {
        const [leaguesRes, teamsRes] = await Promise.all([
          fetch('/api/sportbot/leagues'),
          fetch('/api/sportbot/teams'),
        ])
        if (leaguesRes.ok) {
          const data = await leaguesRes.json()
          setLeagues(data.leagues)
        }
        if (teamsRes.ok) {
          const data = await teamsRes.json()
          setFollowedTeams(data.teams.map((t: FollowedTeam) => ({
            teamId: t.teamId,
            teamName: t.teamName,
            leagueCode: t.leagueCode,
          })))
        }
      } catch (err) {
        console.error('Failed to load leagues:', err)
      } finally {
        setLoadingLeagues(false)
      }
    }
    init()
  }, [])

  // Fetch teams for selected league
  useEffect(() => {
    if (!selectedLeague) {
      setTeams([])
      return
    }

    async function fetchTeams() {
      setLoadingTeams(true)
      try {
        const res = await fetch(`/api/sportbot/leagues/${selectedLeague}/teams`)
        if (res.ok) {
          const data = await res.json()
          setTeams(data.teams)
        }
      } catch (err) {
        console.error('Failed to load teams:', err)
      } finally {
        setLoadingTeams(false)
      }
    }
    fetchTeams()
  }, [selectedLeague])

  const isFollowed = (teamId: number) => followedTeams.some(t => t.teamId === teamId)

  const toggleFollow = async (team: Team) => {
    const league = leagues.find(l => l.code === selectedLeague)
    if (!league) return

    setSavingTeam(team.id)

    if (isFollowed(team.id)) {
      // Unfollow
      await fetch(`/api/sportbot/teams?teamId=${team.id}`, { method: 'DELETE' })
      setFollowedTeams(prev => prev.filter(t => t.teamId !== team.id))
    } else {
      // Follow
      const res = await fetch('/api/sportbot/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team.id,
          teamName: team.name,
          teamShortName: team.shortName,
          teamCrest: team.crest,
          leagueCode: league.code,
          leagueName: league.name,
          leagueEmblem: '', // API returns these separately
        }),
      })

      if (res.ok) {
        setFollowedTeams(prev => [...prev, { teamId: team.id, teamName: team.name, leagueCode: league.code }])
      }
    }

    setSavingTeam(null)
  }

  const filteredTeams = teams.filter(t => {
    const q = searchQuery.toLowerCase()
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.shortName || '').toLowerCase().includes(q) ||
      (t.tla || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/hub/sportbot" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Sport-Bot</span>
          </Link>
          {followedTeams.length > 0 && (
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
              {followedTeams.length} Team{followedTeams.length !== 1 ? 's' : ''} verfolgt
            </span>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Teams auswählen</h1>
          <p className="text-slate-400 mb-8">Wähle eine Liga oder ein Turnier und folge deinen Lieblingsteams und Nationalmannschaften.</p>
        </motion.div>

        {/* League Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {loadingLeagues ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* International Tournaments */}
              {leagues.filter(l => l.type === 'international').length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="text-base">🌍</span> Internationale Turniere
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                    {leagues.filter(l => l.type === 'international').map((league, i) => (
                      <motion.button
                        key={league.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => setSelectedLeague(selectedLeague === league.code ? null : league.code)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                          selectedLeague === league.code
                            ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                            : 'border-amber-500/10 bg-amber-500/5 hover:border-amber-500/20 hover:bg-amber-500/10'
                        }`}
                      >
                        <span className="text-2xl">{league.flag}</span>
                        <span className={`text-xs font-medium text-center ${
                          selectedLeague === league.code ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {league.name}
                        </span>
                        {followedTeams.filter(t => t.leagueCode === league.code).length > 0 && (
                          <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                            {followedTeams.filter(t => t.leagueCode === league.code).length}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* Club Leagues */}
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-base">⚽</span> Vereinsligen
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {leagues.filter(l => l.type !== 'international').map((league, i) => (
                  <motion.button
                    key={league.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setSelectedLeague(selectedLeague === league.code ? null : league.code)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                      selectedLeague === league.code
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{league.flag}</span>
                    <span className={`text-xs font-medium text-center ${
                      selectedLeague === league.code ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {league.name}
                    </span>
                    {followedTeams.filter(t => t.leagueCode === league.code).length > 0 && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                        {followedTeams.filter(t => t.leagueCode === league.code).length}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Teams List */}
        <AnimatePresence mode="wait">
          {selectedLeague && (
            <motion.div
              key={selectedLeague}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Team suchen..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {loadingTeams ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredTeams.map((team, i) => {
                    const followed = isFollowed(team.id)
                    const saving = savingTeam === team.id

                    return (
                      <motion.button
                        key={team.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * i }}
                        onClick={() => toggleFollow(team)}
                        disabled={saving}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                          followed
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {team.crest ? (
                          <Image src={team.crest} alt="" width={40} height={40} className="rounded-xl flex-shrink-0" unoptimized />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${followed ? 'text-emerald-400' : 'text-white'}`}>
                            {team.name}
                          </p>
                          <p className="text-xs text-slate-500">{[team.shortName, team.tla].filter(Boolean).join(' • ') || 'Nationalmannschaft'}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {saving ? (
                            <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                          ) : followed ? (
                            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full border-2 border-slate-600 flex items-center justify-center group-hover:border-emerald-500">
                              {/* empty circle */}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {!loadingTeams && filteredTeams.length === 0 && searchQuery && (
                <p className="text-center text-slate-500 py-8">Kein Team gefunden für &ldquo;{searchQuery}&rdquo;</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Followed Teams Summary */}
        {followedTeams.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 p-5 rounded-2xl border border-white/5 bg-white/[0.02]"
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Verfolgte Teams ({followedTeams.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {followedTeams.map(team => (
                <span
                  key={team.teamId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400"
                >
                  {team.teamName}
                  <button
                    onClick={() => {
                      fetch(`/api/sportbot/teams?teamId=${team.teamId}`, { method: 'DELETE' })
                      setFollowedTeams(prev => prev.filter(t => t.teamId !== team.teamId))
                    }}
                    className="hover:text-rose-400 transition-colors ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
