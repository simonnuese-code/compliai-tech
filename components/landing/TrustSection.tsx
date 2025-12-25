'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { ShieldAlert, Scale, FileWarning, Search, FileText, Activity, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const sliderPoints = [
  {
    id: 'no-legal',
    type: 'limit', // Red
    label: 'Keine Rechtsberatung',
    description: 'Wir liefern technische Analysen und Indikatoren, ersetzen aber keine juristische Beratung durch einen Anwalt.',
    icon: Scale
  },
  {
    id: 'no-liability',
    type: 'limit',
    label: 'Keine Haftungsübernahme',
    description: 'Die finale Verantwortung für Entscheidungen und Compliance bleibt immer beim menschlichen Entscheidungsträger.',
    icon: ShieldAlert
  },
  {
    id: 'no-blackbox',
    type: 'limit',
    label: 'Keine Blackbox',
    description: 'Unsere Algorithmen sind transparent. Wir erklären, wie Ergebnisse zustande kommen – keine "Magie".',
    icon: FileWarning
  },
  {
    id: 'structure',
    type: 'feature', // Blue
    label: 'Strukturierte Erfassung',
    description: 'Systematische Inventarisierung aller KI-Systeme in einer zentralen, übersichtlichen Datenbank.',
    icon: Search
  },
  {
    id: 'assessment',
    type: 'feature',
    label: 'Ersteinschätzung',
    description: 'Wir liefern klare Indikatoren für Risiken basierend auf den Kriterien des EU AI Acts.',
    icon: Activity
  },
  {
    id: 'docs',
    type: 'feature',
    label: 'Dokumentationshilfe',
    description: 'Geführte Erstellung und Verwaltung aller technisch notwendigen Dokumentationen und Nachweise.',
    icon: FileText
  }
]

import { TrustContent } from '@/lib/types/landing'

interface TrustSectionProps {
  content?: TrustContent
}

export default function TrustSection({ content }: TrustSectionProps) {
  const { ref, isInView } = useScrollAnimation()
  const [activeIndex, setActiveIndex] = useState(3) // Start at first feature (index 3)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Progress 0 to 100
  const progress = useMotionValue(60) // Start at 60% (index 3: 3 * 20 = 60)
  const containerRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const hasInitialized = useRef(false)

  // Initial animation
  useEffect(() => {
    if (isInView && !hasInitialized.current && !hasInteracted) {
      hasInitialized.current = true
      // Animate from 0 to 60
      progress.set(0)
      animate(progress, 60, { duration: 1.5, ease: "easeOut" })
    }
  }, [isInView, progress, hasInteracted])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setHasInteracted(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    progress.stop()

    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect()
    }

    // Immediate jump to click position if desired, or just start dragging
    updateProgress(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    updateProgress(e.clientX)
  }

  const updateProgress = (clientX: number) => {
    if (!rectRef.current) return

    const rect = rectRef.current
    const relativeX = clientX - rect.left
    let newProgress = (relativeX / rect.width) * 100

    // Clamp
    if (newProgress < 0) newProgress = 0
    if (newProgress > 100) newProgress = 100

    progress.set(newProgress)

    // Calculate nearest index
    // 6 points: 0, 20, 40, 60, 80, 100
    const step = 100 / (sliderPoints.length - 1)
    const index = Math.round(newProgress / step)

    if (index !== activeIndex) {
      setActiveIndex(index)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    rectRef.current = null

    // Snap to nearest
    const currentProgress = progress.get()
    const step = 100 / (sliderPoints.length - 1)
    const nearestIndex = Math.round(currentProgress / step)
    const targetProgress = nearestIndex * step

    animate(progress, targetProgress, {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.8
    })
    setActiveIndex(nearestIndex)
  }

  const activePoint = sliderPoints[activeIndex]

  return (
    <section
      ref={ref}
      className="py-32 px-4 md:px-6 lg:px-8 relative overflow-hidden bg-slate-950 select-none"
      id="trust"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#020617] to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            Unser Versprechen
          </h2>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Transparenz über Verantwortung und Unterstützung.
          </p>
        </div>

        {/* Slider Container */}
        <div className="w-full max-w-3xl mb-16 relative pt-8 pb-8">

          {/* Labels above slider */}
          <div className="flex justify-between w-full mb-2 md:absolute md:top-0 md:left-0 md:mb-0 text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 pointer-events-none opacity-60">
            <span className="text-rose-500">Was wir NICHT leisten</span>
            <span className="text-cyan-500">Was wir leisten</span>
          </div>

          <div
            className="relative h-16 flex items-center cursor-grab active:cursor-grabbing touch-none"
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Rail Background */}
            <div className="absolute left-0 right-0 h-3 rounded-full bg-slate-900/80 border border-white/5 shadow-inner overflow-hidden backdrop-blur-sm">
              {/* Gradient Track Background */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-rose-900/20 via-slate-900/50 to-cyan-900/20" />

              {/* Active Fill / Glow following handle */}
              <TrackFill progress={progress} />
            </div>

            {/* Nodes */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              {sliderPoints.map((point, index) => (
                <Node
                  key={point.id}
                  index={index}
                  total={sliderPoints.length}
                  activeIndex={activeIndex}
                  type={point.type}
                />
              ))}
            </div>

            {/* Handle */}
            <Handle progress={progress} isDragging={isDragging} activeType={activePoint.type} />
          </div>
        </div>

        {/* Content Card */}
        <div className="w-full max-w-2xl min-h-[220px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePoint.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-8 border backdrop-blur-md shadow-2xl",
                activePoint.type === 'limit'
                  ? "bg-rose-950/20 border-rose-500/20 shadow-rose-900/20"
                  : "bg-cyan-950/20 border-cyan-500/20 shadow-cyan-900/20"
              )}
            >
              {/* Dynamic Light Effect */}
              <motion.div
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
                className={cn(
                  "absolute inset-0 opacity-30 pointer-events-none",
                  activePoint.type === 'limit'
                    ? "bg-[radial-gradient(circle_at_50%_50%,_rgba(244,63,94,0.15),_transparent_60%)]"
                    : "bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.15),_transparent_60%)]"
                )}
                style={{ backgroundSize: "150% 150%" }}
              />

              {/* Moving Spotlight */}
              <motion.div
                animate={{
                  x: ["-10%", "10%", "-10%"],
                  y: ["-10%", "10%", "-10%"],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  "absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-screen",
                  activePoint.type === 'limit'
                    ? "bg-[radial-gradient(circle_at_center,_rgba(244,63,94,0.1),_transparent_70%)]"
                    : "bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1),_transparent_70%)]"
                )}
              />

              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className={cn(
                  "p-4 rounded-2xl border shrink-0",
                  activePoint.type === 'limit'
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                )}>
                  <activePoint.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      activePoint.type === 'limit'
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                    )}>
                      {activePoint.type === 'limit' ? 'Limitierung' : 'Feature'}
                    </span>
                  </div>
                  <h3 className={cn(
                    "text-2xl font-bold mb-2",
                    activePoint.type === 'limit' ? "text-rose-100" : "text-cyan-100"
                  )}>
                    {activePoint.label}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {activePoint.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}

function TrackFill({ progress }: { progress: any }) {
  const width = useTransform(progress, (p: number) => `${p}%`)
  const opacity = useTransform(progress, [0, 50, 100], [0.5, 0.8, 0.5])

  // Dynamic gradient color based on position
  const background = useTransform(
    progress,
    [0, 40, 60, 100],
    [
      "linear-gradient(90deg, rgba(244,63,94,0.5) 0%, rgba(244,63,94,0) 100%)", // Red start
      "linear-gradient(90deg, rgba(244,63,94,0.5) 0%, rgba(244,63,94,0) 100%)", // Red end
      "linear-gradient(90deg, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0) 100%)", // Blue start
      "linear-gradient(90deg, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0) 100%)"  // Blue end
    ]
  )

  return (
    <motion.div
      className="absolute top-0 left-0 bottom-0 will-change-transform"
      style={{ width, background, opacity }}
    />
  )
}

function Node({ index, total, activeIndex, type }: { index: number, total: number, activeIndex: number, type: string }) {
  const position = (index / (total - 1)) * 100
  const isActive = index === activeIndex
  const isPast = index <= activeIndex

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${position}%` }}
    >
      <div className={cn(
        "w-3 h-3 rounded-full transition-all duration-300 border-2",
        isActive
          ? (type === 'limit' ? "bg-rose-500 border-rose-400 scale-125 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-cyan-500 border-cyan-400 scale-125 shadow-[0_0_10px_rgba(6,182,212,0.5)]")
          : isPast
            ? (type === 'limit' ? "bg-rose-900 border-rose-800" : "bg-cyan-900 border-cyan-800")
            : "bg-slate-800 border-slate-700"
      )} />
    </div>
  )
}

function Handle({ progress, isDragging, activeType }: { progress: any, isDragging: boolean, activeType: string }) {
  const left = useTransform(progress, (p: number) => `${p}%`)

  return (
    <motion.div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full z-20 cursor-grab active:cursor-grabbing will-change-transform",
        "bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white",
        activeType === 'limit' ? "shadow-rose-500/30" : "shadow-cyan-500/30"
      )}
      style={{ left }}
      animate={{
        scale: isDragging ? 1.1 : 1,
        boxShadow: isDragging
          ? (activeType === 'limit' ? "0 0 30px rgba(244,63,94,0.6)" : "0 0 30px rgba(6,182,212,0.6)")
          : (activeType === 'limit' ? "0 0 15px rgba(244,63,94,0.3)" : "0 0 15px rgba(6,182,212,0.3)")
      }}
    >
      {/* Inner Dot */}
      <div className={cn(
        "absolute inset-2 rounded-full opacity-80",
        activeType === 'limit' ? "bg-rose-500" : "bg-cyan-500"
      )} />
    </motion.div>
  )
}
