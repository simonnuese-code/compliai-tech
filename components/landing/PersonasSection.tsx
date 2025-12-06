'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { Briefcase, ShieldCheck, Check, Hand } from 'lucide-react'
import type { PersonasContent } from '@/lib/types/landing'
import { cn } from '@/lib/utils'

const personas = [
  {
    id: 'management',
    title: 'Geschäftsführung',
    subline: 'Sicher entscheiden, ohne sich in Details zu verlieren.',
    context: (
      <>
        So unterstützt <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">CompliAI</span> strategische Entscheidungen und reduziert persönliche Haftungsrisiken.
      </>
    ),
    icon: Briefcase,
    benefits: [
      'Haftungsrisiken verstehen statt raten.',
      'Kosten und Aufwand von Compliance klar beziffern.',
      'Auf einen Blick sehen, wo das Unternehmen steht.'
    ],
    gradient: 'from-blue-500/20 to-cyan-500/20',
    glow: 'bg-blue-500/30'
  },
  {
    id: 'it',
    title: 'IT & Datenschutz',
    subline: 'Struktur und Sicherheit in komplexen Systemlandschaften.',
    context: (
      <>
        So macht <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">CompliAI</span> komplexe Anforderungen beherrschbar und schafft klare technische Strukturen.
      </>
    ),
    icon: ShieldCheck,
    benefits: [
      'Alle KI-Systeme und Datenflüsse zentral im Blick behalten.',
      'EU AI Act, DSGVO und interne Vorgaben in einem Workflow vereinen.',
      'Nachvollziehbare Dokumentation auf Knopfdruck liefern.'
    ],
    gradient: 'from-emerald-500/20 to-teal-500/20',
    glow: 'bg-emerald-500/30'
  }
]

interface PersonasSectionProps {
  content: PersonasContent
}

export default function PersonasSection({ content }: PersonasSectionProps) {
  const { ref, isInView } = useScrollAnimation()
  const [activePersona, setActivePersona] = useState<'management' | 'it'>('management')
  const [isPaused, setIsPaused] = useState(false)

  const [tabDimensions, setTabDimensions] = useState<Record<string, { x: number, width: number }>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const x = useMotionValue(0)

  // Measure tabs
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return
      const newDimensions: Record<string, { x: number, width: number }> = {}
      Object.entries(tabsRef.current).forEach(([id, el]) => {
        if (el) {
          newDimensions[id] = {
            x: el.offsetLeft,
            width: el.offsetWidth
          }
        }
      })
      setTabDimensions(newDimensions)
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Animate pill position
  useEffect(() => {
    if (isDragging) return
    const targetX = tabDimensions[activePersona]?.x ?? 0
    animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30
    })
  }, [activePersona, tabDimensions, isDragging, x])

  // Hint Logic
  useEffect(() => {
    if (isDragging || !isInView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowHint(false)
      return
    }
    const timer = setTimeout(() => setShowHint(true), 1500)
    return () => clearTimeout(timer)
  }, [isInView, isDragging])

  // Auto-rotation logic
  useEffect(() => {
    if (isPaused || !isInView || isDragging) return

    const interval = setInterval(() => {
      setActivePersona(prev => prev === 'management' ? 'it' : 'management')
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, isInView, isDragging])

  // Resume rotation after inactivity
  useEffect(() => {
    if (!isPaused) return

    const timeout = setTimeout(() => {
      setIsPaused(false)
    }, 15000)

    return () => clearTimeout(timeout)
  }, [isPaused])

  const handleInteraction = (persona: 'management' | 'it') => {
    setActivePersona(persona)
    setIsPaused(true)
  }

  const activeData = personas.find(p => p.id === activePersona)

  return (
    <section
      ref={ref}
      className="pt-20 pb-12 px-4 md:px-6 lg:px-8 relative overflow-hidden bg-slate-50"
      id="personas"
    >
      {/* Background - Light & Airy */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white/80 pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 tracking-tight"
          >
            {content.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
          >
            {content.subheadline}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Switch Bar */}
          <div className="flex flex-col items-center mb-5">
            <div
              ref={containerRef}
              className="relative inline-flex bg-slate-100/80 backdrop-blur-xl p-1.5 rounded-full border border-white/50 shadow-sm mb-6 select-none touch-none"
            >
              {/* Drag Hint Animation */}
              <AnimatePresence>
                {showHint && !isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2 text-cyan-500/80"
                  >
                    <motion.div
                      animate={{ x: [0, 15, -15, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 0.5
                      }}
                    >
                      <Hand className="w-6 h-6 drop-shadow-sm" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Draggable Liquid Glass Pill */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-full shadow-md z-10 cursor-grab active:cursor-grabbing"
                style={{
                  x,
                  background: "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)",
                }}
                initial={false}
                animate={{
                  width: tabDimensions[activePersona]?.width ?? 0,
                  scale: isDragging ? 1 : [1, 1.03, 1],
                }}
                transition={{
                  width: { type: "spring", stiffness: 300, damping: 30 },
                  scale: { duration: 0.3 }
                }}
                drag="x"
                dragConstraints={containerRef}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => {
                  setIsDragging(true)
                  setIsPaused(true)
                  setShowHint(false)
                  x.stop()
                }}
                onDragEnd={() => {
                  setIsDragging(false)
                  const currentX = x.get()
                  const center = currentX + (tabDimensions[activePersona]?.width ?? 0) / 2

                  let closest = activePersona
                  let minDist = Infinity

                  Object.entries(tabDimensions).forEach(([id, dims]) => {
                    const tabCenter = dims.x + dims.width / 2
                    const dist = Math.abs(center - tabCenter)
                    if (dist < minDist) {
                      minDist = dist
                      closest = id as 'management' | 'it'
                    }
                  })
                  setActivePersona(closest)
                }}
              />

              {personas.map((p) => (
                <button
                  key={p.id}
                  ref={(el) => { if (el) tabsRef.current[p.id] = el }}
                  onClick={() => handleInteraction(p.id as any)}
                  className={cn(
                    "relative z-20 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 w-40",
                    activePersona === p.id ? "text-white" : "text-slate-500 hover:text-slate-700",
                    (isDragging || activePersona === p.id) && "pointer-events-none"
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Context Copy */}
            <AnimatePresence mode="wait">
              <motion.p
                key={activePersona}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-slate-500 text-center max-w-xl h-6"
              >
                {activeData?.context}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Liquid Glass Container */}
          <div className="relative rounded-[40px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl overflow-hidden p-6 md:p-8 max-w-5xl mx-auto">
            {/* Background Gradient Shift based on Active Persona */}
            <motion.div
              className="absolute inset-0 opacity-30 transition-colors duration-700"
              animate={{
                background: activePersona === 'management'
                  ? 'linear-gradient(120deg, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0) 100%)'
                  : 'linear-gradient(120deg, rgba(255, 255, 255, 0) 0%, rgba(16, 185, 129, 0.1) 100%)'
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10">
              {personas.map((persona) => {
                const isActive = activePersona === persona.id
                const Icon = persona.icon

                return (
                  <motion.div
                    key={persona.id}
                    onClick={() => handleInteraction(persona.id as any)}
                    className={cn(
                      "relative rounded-3xl p-6 transition-all duration-500 cursor-pointer group",
                      isActive
                        ? "bg-white/80 shadow-lg border border-white/80"
                        : "bg-white/20 hover:bg-white/40 border border-white/30 hover:border-white/50"
                    )}
                    animate={{
                      scale: isActive ? 1.03 : 0.95,
                      opacity: isActive ? 1 : 0.6,
                      filter: isActive ? 'blur(0px)' : 'blur(1px)'
                    }}
                    whileHover={!isActive ? { y: -4, opacity: 0.85 } : {}}
                  >
                    {/* Avatar Area */}
                    <div className="mb-6 flex justify-center md:justify-start">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-500",
                        isActive ? "shadow-lg scale-110" : "shadow-sm"
                      )}>
                        <div className={cn("absolute inset-0 opacity-20", persona.glow)} />
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className={cn("absolute inset-0 opacity-30 blur-xl", persona.glow)}
                        />
                        <Icon className={cn("w-9 h-9 relative z-10", isActive ? "text-slate-800" : "text-slate-600")} strokeWidth={1.5} />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center md:text-left">
                      <h3 className={cn(
                        "text-xl font-bold mb-2 transition-colors duration-300",
                        isActive ? "text-slate-900" : "text-slate-700"
                      )}>
                        {persona.title}
                      </h3>
                      <p className={cn(
                        "text-base mb-6 transition-colors duration-300 h-12",
                        isActive ? "text-slate-600" : "text-slate-500"
                      )}>
                        {persona.subline}
                      </p>

                      {/* Benefits List */}
                      <div className="space-y-3 text-left">
                        {persona.benefits.map((benefit, idx) => (
                          <motion.div
                            key={idx}
                            initial={false}
                            animate={{
                              opacity: isActive ? 1 : 0.4,
                              x: isActive ? 0 : -10,
                              filter: isActive ? 'blur(0px)' : 'blur(1px)'
                            }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="flex items-start gap-3"
                          >
                            <div className={cn(
                              "mt-1 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                              isActive ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-400"
                            )}>
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            </div>
                            <span className={cn(
                              "text-sm leading-relaxed",
                              isActive ? "text-slate-700" : "text-slate-500"
                            )}>
                              {benefit}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Overlay for Inactive State */}
                    {!isActive && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow-sm border border-white/50">
                          Klicken zum Aktivieren
                        </span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
