'use client'

import { motion } from 'motion/react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Check, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { CTAContent } from '@/lib/types/landing'
import { fadeUp } from '@/lib/animations'

interface CTASectionProps {
  content: CTAContent
}

export default function CTASection({ content }: CTASectionProps) {
  const { ref, isInView } = useScrollAnimation()

  // Hardcoded content based on new specs
  const headline = "In wenigen Minuten eine klare Einschätzung erhalten."
  const subheadline = "Sofortige Orientierung. Präzise Einschätzung. Kostenlos."
  const sloganLine1 = "Don't just comply."
  const sloganLine2 = "Get your"
  const primaryBtn = "Ersten Check starten"
  const secondaryBtn = "Demo ansehen"

  const trustElements = [
    "Bereits 217 Unternehmen nutzen CompliAI",
    "Nur 5 Minuten Zeitaufwand",
    "Keine Kreditkarte erforderlich"
  ]

  return (
    <section
      ref={ref}
      className="relative py-24 px-4 md:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#ECF6FF] to-[#F9FCFF]"
      id="cta"
    >
      {/* Soft Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')] bg-repeat" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="bg-[#172554] rounded-[24px] p-6 md:p-14 text-center shadow-2xl shadow-blue-900/20 overflow-hidden relative border border-white/10"
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
            className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(56,189,248,0.15),_transparent_60%)]"
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
            className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.1),_transparent_70%)] pointer-events-none mix-blend-screen"
          />

          {/* Slogan - Consistent Brand Style */}
          <div className="mb-6 relative z-10">
            <h3 className="text-lg font-bold tracking-tight text-blue-100/90">
              {sloganLine1} {sloganLine2} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">CompliAI</span> !
            </h3>
          </div>

          {/* Headline - Smaller, Serious */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight relative z-10 leading-tight">
            {headline}
          </h2>

          {/* Subheadline - Restrained */}
          <div className="text-base md:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed relative z-10 font-medium">
            {subheadline}
          </div>

          {/* CTA Buttons - Compact, Professional */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 relative z-10">
            <Button
              asChild
              className="bg-white text-slate-900 hover:bg-slate-100 border-0 px-8 h-12 text-base font-bold rounded-full w-full sm:w-auto transition-all hover:scale-[1.01]"
            >
              <Link href="/test" className="inline-flex items-center gap-2">
                {primaryBtn}
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/5 px-6 h-12 text-base font-medium rounded-full w-full sm:w-auto border border-white/10"
              onClick={(e) => {
                e.preventDefault()
                toast.info("Demo-Video folgt in Kürze", {
                  description: "Wir arbeiten gerade am Feinschliff für das Video. Bitte schauen Sie später noch einmal vorbei.",
                  duration: 4000,
                })
              }}
            >
              <Link href="/demo" className="inline-flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                {secondaryBtn}
              </Link>
            </Button>
          </div>

          {/* Trust Elements - De-emphasized */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#D6DFE8] text-xs font-medium relative z-10 tracking-wide opacity-80">
            {trustElements.map((element, index) => (
              <span key={index} className="inline-flex items-center gap-1.5">
                <Check className="w-3 h-3 text-blue-200/70" />
                {element.includes("CompliAI") ? (
                  <>
                    {element.split("CompliAI")[0]}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">CompliAI</span>
                    {element.split("CompliAI")[1]}
                  </>
                ) : (
                  element
                )}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
