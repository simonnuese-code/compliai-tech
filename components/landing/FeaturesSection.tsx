'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { Layout, Star, Shield, Zap, FileText, Users, Search, FileCheck, BarChart3, Lock, Share2, ClipboardList, Hand } from 'lucide-react'
import { cn } from '@/lib/utils'

// Feature Data Structure
const featureCategories = [
    {
        id: 'analyse',
        label: 'Analyse',
        items: [
            {
                title: 'Risk Engine',
                description: 'Automatisierte Ermittlung der Risikoklasse nach EU AI Act.',
                icon: Zap
            },
            {
                title: 'KI-Inventar',
                description: 'Zentrales Verzeichnis aller eingesetzten und entwickelten KI-Systeme.',
                icon: Layout
            },
            {
                title: 'Compliance Score',
                description: 'Visuelle Kennzahl für den aktuellen Compliance-Status.',
                icon: Star
            }
        ]
    },
    {
        id: 'dokumentation',
        label: 'Dokumentation',
        items: [
            {
                title: 'Document Center',
                description: 'Geführte Ablage aller gesetzlich geforderten Nachweise.',
                icon: FileText
            },
            {
                title: 'Policy Library',
                description: 'Vorlagen für Richtlinien und technische Maßnahmen an einem Ort.',
                icon: FileCheck
            },
            {
                title: 'Audit Trail',
                description: 'Lückenlose Historie aller Änderungen und Entscheidungen.',
                icon: Shield
            }
        ]
    },
    {
        id: 'zusammenarbeit',
        label: 'Zusammenarbeit',
        items: [
            {
                title: 'Team Collaboration',
                description: 'Rollenbasierte Zusammenarbeit von Fachbereichen, IT und Rechtsabteilung.',
                icon: Users
            },
            {
                title: 'Aufgaben und Maßnahmen',
                description: 'Verknüpfung von Findings mit konkreten To\u2011dos und Verantwortlichkeiten.',
                icon: ClipboardList
            },
            {
                title: 'Reporting & Exporte',
                description: 'Berichte und Exporte für Management und Aufsichtsbehörden auf Knopfdruck.',
                icon: BarChart3
            }
        ]
    }
]

export default function FeaturesSection({ content }: { content: any }) {
    const { ref, isInView } = useScrollAnimation()
    const [activeTab, setActiveTab] = useState('analyse')
    const [isDragging, setIsDragging] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({})
    const [tabDimensions, setTabDimensions] = useState<Record<string, { x: number, width: number }>>({})

    const x = useMotionValue(0)

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

    // Animate x when activeTab changes (and not dragging)
    useEffect(() => {
        if (isDragging) return

        const targetX = tabDimensions[activeTab]?.x ?? 0
        animate(x, targetX, {
            type: "spring",
            stiffness: 300,
            damping: 30
        })
    }, [activeTab, tabDimensions, isDragging, x])

    // Hint Animation Logic
    useEffect(() => {
        if (isDragging || !isInView) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowHint(false)
            return
        }

        const startTimer = setTimeout(() => {
            setShowHint(true)
        }, 1500)

        return () => {
            clearTimeout(startTimer)
        }
    }, [isInView, isDragging])

    const activeCategory = featureCategories.find(c => c.id === activeTab)

    return (
        <section
            ref={ref}
            className="min-h-screen flex flex-col justify-center py-32 px-4 md:px-6 lg:px-8 relative overflow-hidden bg-slate-900"
            id="features"
        >
            {/* Soft Blend from Previous Section (Problem - Dark) */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Central Radial Glow - Spotlight Effect */}
                <div
                    className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-1000 opacity-40",
                        activeTab === 'analyse' && "bg-cyan-600/30",
                        activeTab === 'dokumentation' && "bg-blue-600/30",
                        activeTab === 'zusammenarbeit' && "bg-indigo-600/30"
                    )}
                />

                {/* Diagonal Gradient Component */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-transparent to-slate-900/50" />
            </div>

            <div className="max-w-6xl mx-auto relative z-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block text-cyan-400 font-semibold tracking-wider uppercase text-sm mb-4">
                            Plattform Features
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                            Alles für Ihre EU AI Act Compliance.
                        </h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">CompliAI</span> bündelt Analyse, Dokumentation und Zusammenarbeit in einem durchgängigen Compliance-Workflow.
                        </p>
                    </motion.div>
                </div>

                {/* Interactive Tabs */}
                <div className="flex justify-center mb-16 w-full overflow-x-auto px-4 pb-4 md:pb-0 no-scrollbar">
                    <div
                        ref={containerRef}
                        className="inline-flex p-1.5 rounded-full bg-slate-950/50 border border-white/10 backdrop-blur-xl shadow-lg relative select-none touch-none [-webkit-tap-highlight-color:transparent] min-w-fit mx-auto"
                    >
                        {/* Drag Hint Animation */}
                        <AnimatePresence>
                            {showHint && !isDragging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                    className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2 text-cyan-400/60"
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
                                        <Hand className="w-6 h-6 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Draggable Liquid Glass Pill */}
                        <motion.div
                            className="absolute top-1.5 bottom-1.5 rounded-full shadow-[0_0_32px_rgba(75,189,255,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] z-10 cursor-grab active:cursor-grabbing select-none touch-none"
                            style={{
                                x,
                                background: "linear-gradient(90deg, rgba(66, 199, 255, 0.9) 0%, rgba(24, 144, 255, 0.9) 50%, rgba(14, 91, 216, 0.9) 100%)",
                                backdropFilter: "blur(18px) saturate(140%) brightness(1.1)"
                            }}
                            initial={false}
                            animate={{
                                width: tabDimensions[activeTab]?.width ?? 0,
                                scale: isDragging ? 1 : [1, 1.03, 1],
                                backdropFilter: isDragging ? "blur(22px) saturate(160%) brightness(1.2)" : "blur(18px) saturate(140%) brightness(1.1)"
                            }}
                            transition={{
                                width: { type: "spring", stiffness: 300, damping: 30 },
                                scale: { duration: 0.3, times: [0, 0.5, 1] },
                                backdropFilter: { duration: 0.2 }
                            }}
                            drag="x"
                            dragConstraints={containerRef}
                            dragElastic={0}
                            dragMomentum={false}
                            onDragStart={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                                // Stop any ongoing animation on x
                                x.stop()
                            }}
                            onDragEnd={(e, info) => {
                                setIsDragging(false)
                                // Calculate position relative to container
                                // info.point.x is page coordinates, we need relative to container
                                // But x motion value is already relative translation.
                                // The pill's x value is the transform.
                                // We can use x.get() to get the current transform value.

                                const currentX = x.get()
                                const center = currentX + (tabDimensions[activeTab]?.width ?? 0) / 2

                                let closestTab = activeTab
                                let minDistance = Infinity

                                Object.entries(tabDimensions).forEach(([id, dims]) => {
                                    const tabCenter = dims.x + dims.width / 2
                                    const distance = Math.abs(center - tabCenter)
                                    if (distance < minDistance) {
                                        minDistance = distance
                                        closestTab = id
                                    }
                                })

                                setActiveTab(closestTab)
                            }}
                        />

                        {featureCategories.map((category) => (
                            <button
                                key={category.id}
                                ref={(el) => {
                                    if (el) tabsRef.current[category.id] = el
                                }}
                                onClick={() => {
                                    setActiveTab(category.id)
                                }}
                                className={cn(
                                    "relative px-6 py-2.5 rounded-full text-sm md:text-base transition-all duration-300 z-20 flex items-center justify-center",
                                    activeTab === category.id
                                        ? "text-white font-semibold"
                                        : "text-slate-400 font-medium hover:text-slate-200",
                                    (isDragging || activeTab === category.id) && "pointer-events-none"
                                )}
                            >
                                <span className="relative">{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature Cards Grid */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 pb-12"
                        >
                            {activeCategory?.items.map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <motion.div
                                        key={item.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        className="group relative h-full"
                                    >
                                        {/* Card Background - Liquid Glass */}
                                        <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg group-hover:shadow-cyan-500/10 group-hover:border-white/20 transition-all duration-300" />

                                        {/* Glow Effect on Hover */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative p-8 flex flex-col h-full z-10">
                                            {/* Icon */}
                                            <div className="mb-6 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-cyan-400 group-hover:text-white group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all duration-300 w-fit">
                                                <Icon className="w-6 h-6 stroke-[1.5]" />
                                            </div>

                                            {/* Content */}
                                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-100 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                                                {item.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Soft Blend to Next Section */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none" />
        </section>
    )
}
