'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'

const sections = [
    { id: 'hero', theme: 'light' },
    { id: 'problem', theme: 'dark' },
    { id: 'solution', theme: 'light' },
    { id: 'features', theme: 'light' },
    { id: 'personas', theme: 'light' },
    { id: 'trust', theme: 'light' },
    { id: 'cta', theme: 'light' },
]

export default function SectionNavigation() {
    const [activeSection, setActiveSection] = useState('hero')
    const [isVisible, setIsVisible] = useState(true)
    const [currentTheme, setCurrentTheme] = useState('light')
    const [isDragging, setIsDragging] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const knobRef = useRef<HTMLDivElement>(null)
    const rafId = useRef<number | null>(null)

    // Motion value for smooth knob animation when NOT dragging
    const knobY = useSpring(24, { stiffness: 300, damping: 30 })

    // Layout constants
    const PADDING_TOP = 24
    const ITEM_HEIGHT = 40
    const TRACK_HEIGHT = (sections.length - 1) * ITEM_HEIGHT
    const MIN_Y = PADDING_TOP
    const MAX_Y = PADDING_TOP + TRACK_HEIGHT

    // Visibility logic
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 100)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Observer for Active Section (when not dragging)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (isDragging) return

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                        const section = sections.find(s => s.id === entry.target.id)
                        if (section) setCurrentTheme(section.theme)
                    }
                })
            },
            {
                rootMargin: '-40% 0px -40% 0px',
                threshold: 0.1
            }
        )

        sections.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [isDragging])

    // Sync Knob with Active Section (when not dragging)
    useEffect(() => {
        if (!isDragging) {
            const index = sections.findIndex(s => s.id === activeSection)
            if (index !== -1) {
                const targetY = PADDING_TOP + index * ITEM_HEIGHT
                knobY.set(targetY)
            }
        }
    }, [activeSection, isDragging, knobY])

    // Snap to Section Logic
    const snapToNearestSection = useCallback(() => {
        const currentScroll = window.scrollY
        const sectionElements = sections.map(s => document.getElementById(s.id))

        let nearestSection = sections[0]
        let minDistance = Infinity

        sectionElements.forEach((el, index) => {
            if (el) {
                const distance = Math.abs(el.offsetTop - currentScroll)
                if (distance < minDistance) {
                    minDistance = distance
                    nearestSection = sections[index]
                }
            }
        })

        const element = document.getElementById(nearestSection.id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
            setActiveSection(nearestSection.id)
            setCurrentTheme(nearestSection.theme)
        }
    }, [])

    // Custom Drag Handler using Pointer Events
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        setIsDragging(true)

        const startY = e.clientY
        const startKnobY = knobY.get()

        const handlePointerMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault()

            if (rafId.current) cancelAnimationFrame(rafId.current)

            rafId.current = requestAnimationFrame(() => {
                const deltaY = moveEvent.clientY - startY
                const newKnobY = Math.max(MIN_Y, Math.min(MAX_Y, startKnobY + deltaY))

                // Update Knob UI immediately
                knobY.set(newKnobY) // true = jump to value (no spring)

                // Calculate Scroll Position
                // Map Knob Position (MIN_Y to MAX_Y) to Scroll Position (0 to MaxScroll)
                const progress = (newKnobY - MIN_Y) / (MAX_Y - MIN_Y)
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight
                const targetScroll = progress * maxScroll

                window.scrollTo({
                    top: targetScroll,
                    behavior: 'auto' // Instant for direct control
                })
            })
        }

        const handlePointerUp = () => {
            setIsDragging(false)
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)

            // Snap on release
            snapToNearestSection()
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: false })
        window.addEventListener('pointerup', handlePointerUp)
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    // Styles based on theme
    const isDark = currentTheme === 'dark'

    const containerClasses = isDark
        ? "bg-white/10 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
        : "bg-slate-900/5 border-slate-900/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"

    const trackClasses = isDark
        ? "bg-slate-200/20"
        : "bg-slate-900/10"

    const dotClasses = isDark
        ? "bg-slate-400/50 group-hover:bg-slate-200/80"
        : "bg-slate-400/50 group-hover:bg-slate-600/80"

    const knobClasses = isDark
        ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] ring-white/30"
        : "bg-slate-500 shadow-[0_0_15px_rgba(15,23,42,0.3)] ring-slate-900/20"

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block select-none touch-none"
                >
                    {/* Subtle Glow Layer */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[calc(100%+40px)] bg-cyan-500/20 blur-[40px] rounded-full pointer-events-none z-[-1]"
                    />

                    {/* Liquid Glass Pill */}
                    <div
                        ref={containerRef}
                        className={cn(
                            "relative w-[46px] rounded-full backdrop-blur-xl border transition-all duration-500",
                            containerClasses
                        )}
                        style={{ height: `${48 + sections.length * 40 - 24}px` }}
                    >

                        {/* Track Line */}
                        <div
                            className={cn("absolute top-[24px] bottom-[24px] left-1/2 -translate-x-1/2 w-[2px] rounded-full transition-colors duration-500", trackClasses)}
                        />

                        {/* Dots Container */}
                        <div className="absolute inset-0 flex flex-col items-center pt-[24px] gap-[24px] pointer-events-none">
                            {sections.map((section) => (
                                <div key={section.id} className="relative w-[16px] h-[16px] flex items-center justify-center">
                                    <div
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                            dotClasses,
                                            activeSection === section.id && "opacity-0"
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Interactive Layer (Click Targets) */}
                        <div className="absolute inset-0 flex flex-col items-center pt-[24px] gap-[24px]">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="w-[16px] h-[16px] rounded-full outline-none group cursor-pointer z-10"
                                    aria-label={`Scroll to section ${section.id}`}
                                />
                            ))}
                        </div>

                        {/* Draggable Knob */}
                        <motion.div
                            ref={knobRef}
                            className={cn(
                                "absolute left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-full ring-2 cursor-grab active:cursor-grabbing z-20",
                                knobClasses,
                                isDragging && "scale-110 ring-4"
                            )}
                            style={{ y: knobY }}
                            onPointerDown={handlePointerDown}
                            whileHover={{ scale: 1.1 }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
