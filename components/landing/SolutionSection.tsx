'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import type { SolutionContent } from '@/lib/types/landing'
import { fadeUp } from '@/lib/animations'
import SectionDivider from '@/components/ui/SectionDivider'
import { cn } from '@/lib/utils'
import {
  Check, FileText, Search, Shield, AlertTriangle, BarChart3, List, Settings,
  LayoutDashboard, Folder, History, Download, ChevronRight, Activity, PieChart, FileCheck
} from 'lucide-react'

interface SolutionSectionProps {
  content: SolutionContent
}

// Mockup Components for the 3 Phases

const MockupAnalyse = () => (
  <div className="w-full h-full p-6 flex flex-col gap-4">
    {/* Header: Analysis Mode Indicator */}
    <div className="flex justify-between items-center">
      <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">Analysis Mode</span>
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/40 border border-white/50 flex items-center justify-center">
          <Settings className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>

    <div className="flex gap-4 h-full">
      {/* Left Column: Risk & Data */}
      <div className="w-7/12 flex flex-col gap-4">
        {/* Risk Class Card */}
        <div className="flex-1 rounded-2xl bg-white/60 border border-white/50 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-24 h-24 text-cyan-900" />
          </div>

          <div className="flex justify-between items-start z-10">
            <div className="px-2 py-1 rounded bg-cyan-100/50 text-[10px] font-bold text-cyan-700 uppercase">Risk Class</div>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>

          <div className="z-10 space-y-1">
            <div className="text-4xl font-bold text-slate-800 leading-none tracking-tight">High</div>
            <div className="text-xs text-slate-500 font-medium">Requires Conformity Assessment</div>
          </div>

          {/* Micro Graph */}
          <div className="flex items-end gap-1 h-8 mt-2 z-10">
            <div className="w-1/5 h-3/4 rounded-t bg-cyan-200" />
            <div className="w-1/5 h-1/2 rounded-t bg-cyan-200/60" />
            <div className="w-1/5 h-full rounded-t bg-cyan-500" />
            <div className="w-1/5 h-2/3 rounded-t bg-cyan-300" />
            <div className="w-1/5 h-1/3 rounded-t bg-cyan-200/40" />
          </div>
        </div>

        {/* Data Points Card */}
        <div className="h-24 rounded-2xl bg-white/40 border border-white/40 p-4 flex flex-col justify-center gap-3 shadow-sm">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Confidence</span>
            <span className="text-cyan-600">98%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="w-[98%] h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600" />
          </div>
          <div className="flex gap-2">
            <div className="px-2 py-0.5 rounded bg-white/50 text-[10px] text-slate-400 border border-white/60">Biometric</div>
            <div className="px-2 py-0.5 rounded bg-white/50 text-[10px] text-slate-400 border border-white/60">Personal</div>
          </div>
        </div>
      </div>

      {/* Right Column: Score & Trend */}
      <div className="w-5/12 flex flex-col gap-4">
        <div className="h-full rounded-2xl bg-gradient-to-b from-cyan-50/50 to-white/40 border border-cyan-100/50 p-4 flex flex-col items-center justify-center gap-4 shadow-sm relative overflow-hidden">
          {/* Background Trend Line */}
          <svg className="absolute inset-0 w-full h-full opacity-20 text-cyan-500" preserveAspectRatio="none">
            <path d="M0 100 C 40 80, 80 80, 120 40 S 160 20, 200 10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>

          <div className="relative z-10">
            <div className="w-28 h-28 rounded-full border-8 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold">85</div>
                <div className="text-[10px] uppercase opacity-80 font-medium">Score</div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-cyan-100">
              <Check className="w-4 h-4 text-cyan-600" />
            </div>
          </div>

          <div className="text-center z-10">
            <div className="text-sm font-bold text-slate-700">Compliance Ready</div>
            <div className="text-[10px] text-slate-500">Last check: 2m ago</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const MockupDokumentation = () => (
  <div className="w-full h-full p-6 flex flex-col gap-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
          <Folder className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">System Inventory</div>
          <div className="text-[10px] text-slate-500">All AI Systems</div>
        </div>
      </div>
      <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
        v2.4 Active
      </div>
    </div>

    {/* Document List */}
    <div className="flex-1 space-y-2 overflow-hidden">
      {[
        { title: "Technical Documentation", ver: "v1.2", status: "Done", cat: "Core" },
        { title: "Risk Assessment", ver: "v1.0", status: "Review", cat: "Risk" },
        { title: "Data Governance", ver: "v2.1", status: "Done", cat: "Data" }
      ].map((doc, i) => (
        <div key={i} className="group flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/60 hover:bg-white/80 hover:shadow-sm transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 truncate">{doc.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{doc.ver}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] text-slate-500">{doc.cat}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.status === "Done" ? (
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <Activity className="w-3 h-3 text-orange-500" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Bottom Stats Cards */}
    <div className="flex gap-3 mt-auto">
      <div className="flex-1 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-3 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Open Items</div>
          <div className="text-xl font-bold text-slate-800">3</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500">
          <List className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-3 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Pending</div>
          <div className="text-xl font-bold text-slate-800">1</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500">
          <History className="w-4 h-4" />
        </div>
      </div>
    </div>
  </div>
)

const MockupVorlagen = () => (
  <div className="w-full h-full p-6 flex gap-4">
    {/* Left: Template Cards */}
    <div className="w-1/3 flex flex-col gap-3">
      {[
        { name: "Risk Template", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-50", status: "Ready" },
        { name: "Tech Checklist", icon: FileCheck, color: "text-purple-500", bg: "bg-purple-50", status: "Draft" },
        { name: "Export Report", icon: PieChart, color: "text-blue-500", bg: "bg-blue-50", status: "New" }
      ].map((t, i) => (
        <div key={i} className="flex-1 rounded-xl bg-white/60 border border-white/50 p-3 flex flex-col justify-between hover:bg-white/80 transition-colors cursor-pointer group shadow-sm">
          <div className="flex justify-between items-start">
            <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center ${t.color}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 leading-tight mb-1">{t.name}</div>
            <div className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[9px] text-slate-500 font-medium">{t.status}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Right: Preview Panel */}
    <div className="w-2/3 rounded-2xl bg-white/40 border border-white/50 p-4 flex flex-col shadow-sm backdrop-blur-md relative overflow-hidden">
      {/* Panel Header */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-200/50 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">ISO 42001 Preview</span>
        </div>
        <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors cursor-pointer">
          <Download className="w-3 h-3 text-indigo-600" />
        </div>
      </div>

      {/* Dummy Content */}
      <div className="space-y-3 opacity-60">
        <div className="w-3/4 h-4 rounded bg-slate-800/10 mb-2" />
        <div className="space-y-2">
          <div className="w-full h-2 rounded bg-slate-800/5" />
          <div className="w-full h-2 rounded bg-slate-800/5" />
          <div className="w-5/6 h-2 rounded bg-slate-800/5" />
        </div>

        <div className="pt-2 flex gap-3">
          <div className="w-1/2 h-20 rounded-lg bg-slate-50 border border-slate-100 p-2 space-y-2">
            <div className="w-4 h-4 rounded bg-slate-200" />
            <div className="w-full h-1.5 rounded bg-slate-200" />
            <div className="w-2/3 h-1.5 rounded bg-slate-200" />
          </div>
          <div className="w-1/2 h-20 rounded-lg bg-slate-50 border border-slate-100 p-2 space-y-2">
            <div className="w-4 h-4 rounded bg-slate-200" />
            <div className="w-full h-1.5 rounded bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Overlay Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
    </div>
  </div>
)

export default function SolutionSection({ content }: SolutionSectionProps) {
  const { ref, isInView } = useScrollAnimation()
  const [activePhase, setActivePhase] = useState(0)

  // Cycle through phases - resets timer whenever activePhase changes (auto or manual)
  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 3)
    }, 4000)

    return () => clearInterval(interval)
  }, [isInView, activePhase])

  const handlePhaseClick = (index: number) => {
    setActivePhase(index);
    // Smooth scroll to center the section
    (ref.current as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const formatBrandText = (text: string) => {
    if (!text) return null
    const parts = text.split('CompliAI')
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
                CompliAI
              </span>
            )}
          </span>
        ))}
      </>
    )
  }

  if (!content) return null

  const colors = ['bg-cyan-500', 'bg-blue-500', 'bg-indigo-500']
  const textColors = ['text-cyan-600', 'text-blue-600', 'text-indigo-600']

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col justify-center relative py-32 px-4 md:px-6 lg:px-8 overflow-hidden bg-blue-50/50"
      id="solution"
    >
      <SectionDivider position="top" variant="dark-to-light" />
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Content */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 tracking-tight">
              {content.headline}
            </h2>
            <div className="text-lg text-slate-600 mb-12 leading-relaxed">
              {formatBrandText(content.subheadline)}
            </div>

            <div className="space-y-8 relative">
              {/* Connecting Line - Perfectly Centered & Fixed Size */}
              <div className="absolute left-3 md:left-6 top-[2px] h-[316px] w-[2px] -translate-x-1/2 bg-slate-200" />

              {content.items.map((item, index) => {
                const isActive = activePhase === index
                return (
                  <div
                    key={item.title}
                    className="relative pl-10 md:pl-16 cursor-pointer group"
                    onClick={() => handlePhaseClick(index)}
                  >
                    {/* Dot - Perfectly Centered on Line */}
                    <div
                      className={cn(
                        "absolute left-3 md:left-6 top-2 w-3 h-3 -translate-x-1/2 rounded-full transition-all duration-500 z-10",
                        isActive
                          ? cn(colors[index], "shadow-[0_0_12px_rgba(0,0,0,0.2)] ring-2 ring-white/50")
                          : "bg-white border border-slate-300 group-hover:border-slate-400 group-hover:scale-110"
                      )}
                    />

                    <motion.div
                      animate={{
                        opacity: isActive ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3
                        className={cn(
                          "text-xl font-bold mb-2 transition-colors duration-500",
                          isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                        )}
                      >
                        {item.title}
                      </h3>
                      <div className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                        {item.description}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: Dynamic Visual Mockup */}
          <div className="relative aspect-[4/3] lg:aspect-square max-h-[600px]">
            <div className="absolute inset-0 rounded-3xl overflow-hidden border border-white/60 shadow-2xl bg-white/40 backdrop-blur-xl transition-all duration-500">
              {/* Fake Sidebar */}
              <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-white/30 bg-white/20 flex flex-col items-center py-6 gap-4 z-20">
                <div className="w-10 h-10 rounded-xl bg-slate-900/5" />
                <div className="w-8 h-8 rounded-lg bg-slate-400/10 mt-8" />
                <div className="w-8 h-8 rounded-lg bg-slate-400/10" />
                <div className="w-8 h-8 rounded-lg bg-slate-400/10" />
              </div>

              {/* Fake Header */}
              <div className="absolute top-0 left-20 right-0 h-16 border-b border-white/30 bg-white/20 flex items-center px-8 justify-between z-20">
                <div className="w-32 h-4 rounded-full bg-slate-900/5" />
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900/5" />
                  <div className="w-8 h-8 rounded-full bg-slate-900/5" />
                </div>
              </div>

              {/* Content Area */}
              <div className="absolute top-16 left-20 right-0 bottom-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full h-full"
                  >
                    {activePhase === 0 && <MockupAnalyse />}
                    {activePhase === 1 && <MockupDokumentation />}
                    {activePhase === 2 && <MockupVorlagen />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
