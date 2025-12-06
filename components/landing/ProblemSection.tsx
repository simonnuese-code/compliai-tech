'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { AlertTriangle, FileText, Clock } from 'lucide-react'
import type { ProblemContent } from '@/lib/types/landing'
import { cn } from '@/lib/utils'

const icons = [AlertTriangle, FileText, Clock]

// Map titles to "Big Numbers" for visual impact
const bigNumbers = [
  { value: '35 Mio €', label: 'Bußgelder' },
  { value: '160', label: 'Seiten Regulierung' },
  { value: '600 €/h', label: 'Beratungskosten' },
]

interface ProblemSectionProps {
  content: ProblemContent
}

export default function ProblemSection({ content }: ProblemSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  if (!content) return null

  return (
    <section
      ref={containerRef}
      className="min-h-screen flex flex-col justify-center py-24 px-4 md:px-6 lg:px-8 relative overflow-hidden bg-slate-950"
      id="problem"
    >
      {/* Dynamic Background - Liquid Feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-subtle" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-subtle" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]"
          >
            Das Risiko wächst. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Ihre Compliance nicht.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed"
          >
            {content.subheadline}
          </motion.p>
        </div>

        {/* Liquid Glass Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {content.items.map((item, index) => {
            const Icon = icons[index % icons.length]
            const bigNumber = bigNumbers[index % bigNumbers.length]

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
                className="group relative flex flex-col h-full"
              >
                {/* Glass Card */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-[24px] border border-white/10 group-hover:border-white/20 transition-colors duration-500" />

                {/* Content */}
                <div className="relative p-6 flex flex-col h-full z-10">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all duration-500 inline-flex">
                      <Icon className="w-6 h-6 text-white stroke-[2px]" />
                    </div>
                  </div>

                  {/* Big Number Visual */}
                  <div className="mb-1">
                    <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform duration-500 origin-left">
                      {bigNumber.value}
                    </div>
                  </div>

                  {/* Label */}
                  <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
                    {bigNumber.label}
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="space-y-1">
                      {item.description.split('\n').map((line, i) => (
                        <p key={i} className="text-slate-400 text-sm leading-tight">
                          {line.replace(/^[•-]\s*/, '')}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
