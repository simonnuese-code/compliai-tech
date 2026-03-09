'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Bell,
  BellOff,
  Smartphone,
  Clock,
  Globe,
  Save,
  Loader2,
  Check,
  QrCode,
  Wifi,
  WifiOff,
} from 'lucide-react'

interface Settings {
  preMatchMinutes: number
  notificationsEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timezone: string
}

interface WhatsApp {
  status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTED' | 'FAILED'
  phoneNumber: string | null
  lastSeenAt: string | null
}

export default function SportBotSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    preMatchMinutes: 15,
    notificationsEnabled: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Europe/Berlin',
  })
  const [whatsapp, setWhatsapp] = useState<WhatsApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [connectingWA, setConnectingWA] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/sportbot/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.settings) setSettings(data.settings)
          if (data.whatsapp) setWhatsapp(data.whatsapp)
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/sportbot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  // Poll for connection status
  useEffect(() => {
    if (!qrCode && whatsapp?.status !== 'QR_READY') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sportbot/whatsapp')
        if (res.ok) {
          const data = await res.json()
          
          if (data.status === 'CONNECTED') {
            setWhatsapp(data)
            setQrCode(null)
            clearInterval(interval)
          } else if (data.qrCode && data.qrCode !== qrCode) {
            setQrCode(data.qrCode)
            setWhatsapp(data)
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [qrCode, whatsapp?.status])

  const handleConnectWhatsApp = async () => {
    setConnectingWA(true)
    try {
      const res = await fetch('/api/sportbot/whatsapp', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.qrCode) {
          setQrCode(data.qrCode)
          if (whatsapp) setWhatsapp({ ...whatsapp, status: 'QR_READY' })
        } else {
          // Force polling to start immediately to fetch the QR code when ready
          if (whatsapp) setWhatsapp({ ...whatsapp, status: 'QR_READY' })
        }
      }
    } catch (err) {
      console.error('Failed to connect WhatsApp:', err)
    } finally {
      setConnectingWA(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/hub/sportbot" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Sport-Bot</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-2">Einstellungen</h1>
          <p className="text-slate-400 mb-8">Benachrichtigungen und WhatsApp konfigurieren.</p>
        </motion.div>

        {/* WhatsApp Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Smartphone className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">WhatsApp verbinden</h2>
              <p className="text-sm text-slate-400">Erhalte Live-Updates direkt per WhatsApp</p>
            </div>
          </div>

          {whatsapp?.status === 'CONNECTED' ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Wifi className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Verbunden</p>
                {whatsapp.phoneNumber && (
                  <p className="text-xs text-slate-400">{whatsapp.phoneNumber}</p>
                )}
              </div>
            </div>
          ) : qrCode ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-300 mb-4">Scanne diesen QR-Code mit WhatsApp:</p>
              <div className="inline-block p-4 bg-white rounded-2xl mb-4">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-slate-500">WhatsApp → Einstellungen → Verknüpfte Geräte → Gerät hinzufügen</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 flex-1">
                <WifiOff className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    {whatsapp?.status === 'QR_READY' && !qrCode ? "Verbindung wird hergestellt..." : "Nicht verbunden"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {whatsapp?.status === 'QR_READY' && !qrCode ? "Warte auf QR-Code vom Server" : "Verbinde WhatsApp für Live-Benachrichtigungen"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectWhatsApp}
                disabled={connectingWA || (whatsapp?.status === 'QR_READY' && !qrCode)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-400 transition-all disabled:opacity-50"
              >
                {connectingWA || (whatsapp?.status === 'QR_READY' && !qrCode) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Verbinden
              </button>
            </div>
          )}
        </motion.section>

        {/* Notification Settings */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Benachrichtigungen</h2>
              <p className="text-sm text-slate-400">Welche Updates möchtest du erhalten?</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                {settings.notificationsEnabled ? (
                  <Bell className="h-5 w-5 text-emerald-400" />
                ) : (
                  <BellOff className="h-5 w-5 text-slate-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">Benachrichtigungen aktiv</p>
                  <p className="text-xs text-slate-500">Alle Benachrichtigungen ein/ausschalten</p>
                </div>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Pre-match reminder */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Erinnerung vor Spielbeginn</p>
                  <p className="text-xs text-slate-500">Wie viele Minuten vorher?</p>
                </div>
              </div>
              <select
                value={settings.preMatchMinutes}
                onChange={e => setSettings(s => ({ ...s, preMatchMinutes: Number(e.target.value) }))}
                className="bg-white/10 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
              >
                <option value={5}>5 Min</option>
                <option value={10}>10 Min</option>
                <option value={15}>15 Min</option>
                <option value={30}>30 Min</option>
                <option value={60}>1 Stunde</option>
              </select>
            </div>

            {/* Quiet hours */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Ruhezeiten</p>
                  <p className="text-xs text-slate-500">Keine Benachrichtigungen in diesem Zeitraum</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-8">
                <input
                  type="time"
                  value={settings.quietHoursStart || '23:00'}
                  onChange={e => setSettings(s => ({ ...s, quietHoursStart: e.target.value }))}
                  className="bg-white/10 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-slate-500 text-sm">bis</span>
                <input
                  type="time"
                  value={settings.quietHoursEnd || '07:00'}
                  onChange={e => setSettings(s => ({ ...s, quietHoursEnd: e.target.value }))}
                  className="bg-white/10 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Zeitzone</p>
                </div>
              </div>
              <select
                value={settings.timezone}
                onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
                className="bg-white/10 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                <option value="Europe/Rome">Rom (CET/CEST)</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Event Types Info */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Benachrichtigungen bei</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { emoji: '⚽', label: 'Tore' },
              { emoji: '🟥', label: 'Rote Karten' },
              { emoji: '🎯', label: 'Elfmeter' },
              { emoji: '⏱️', label: 'Anpfiff' },
              { emoji: '⏸️', label: 'Halbzeit' },
              { emoji: '🏁', label: 'Abpfiff' },
              { emoji: '📢', label: 'Vor Spielbeginn' },
              { emoji: '📊', label: 'VAR-Entscheidung' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-xs text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  )
}
