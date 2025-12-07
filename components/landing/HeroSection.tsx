'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { HeroContent } from '@/lib/types/landing'
import { fadeUp, headlineReveal, fadeInScale, containerStagger } from '@/lib/animations'

interface HeroSectionProps {
  content: HeroContent
}

export default function HeroSection({ content }: HeroSectionProps) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 120], [1, 0])
  const y = useTransform(scrollY, [0, 120], [0, 20])

  if (!content) return null

  const headlineParts = content.headline.split('EU AI Act')

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 hero-section z-20 shadow-[0_6px_36px_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl mx-auto px-6 md:px-6 lg:px-8 text-center">
        {/* Headline */}
        <div className="overflow-hidden mb-8">
          <motion.h1
            variants={headlineReveal}
            initial="initial"
            animate="animate"
            className="text-3xl md:text-[72px] font-extrabold leading-[1.1] tracking-tight text-slate-900 will-change-transform"
          >
            {headlineParts.length > 1 ? (
              <>
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-flow animate-pulse-subtle inline-block">EU AI Act</span>
                {headlineParts[1]}
              </>
            ) : (
              content.headline
            )}
          </motion.h1>
        </div>

        {/* Subheadline */}
        <motion.div
          variants={containerStagger}
          initial="initial"
          animate="animate"
          className="text-lg md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-normal flex flex-wrap justify-center gap-x-1.5"
        >
          {content.subheadline.split(' ').map((word, i) => (
            <motion.span key={i} variants={fadeInScale} className="inline-block will-change-transform">
              {word}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="mb-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {content.ctaPrimary && (
            <Button
              asChild
              size="lg"
              className="px-6 py-6 md:px-10 md:py-7 text-lg md:text-xl group font-bold w-full sm:w-auto rounded-full shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 border-0 text-white hover:scale-105"
            >
              <Link href="/test" className="inline-flex items-center gap-2">
                {content.ctaPrimary}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          )}

          {content.ctaSecondary && (
            <Button
              size="lg"
              variant="ghost"
              className="px-8 py-6 text-lg font-medium w-full sm:w-auto rounded-full text-slate-600 hover:bg-slate-100"
              onClick={() => {
                toast.info("Demo-Video folgt in Kürze", {
                  description: "Wir arbeiten gerade am Feinschliff für das Video. Bitte schauen Sie später noch einmal vorbei.",
                  duration: 4000,
                })
              }}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {content.ctaSecondary}
            </Button>
          )}
        </motion.div>

        {/* Features - Trust Bar */}
        {content.features && content.features.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
            className="inline-flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10 bg-white/80 backdrop-blur-md px-12 py-6 rounded-xl border border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          >
            {content.features.map((feature, index) => (
              <span key={index} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="text-sky-500 font-bold text-base">✓</span>
                {feature}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll Indicator - Mouse Style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ opacity, y }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[22px] h-[36px] rounded-full border-[1.5px] border-slate-400/60 flex justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="w-1 h-1.5 rounded-full bg-slate-600"
          />
        </div>
      </motion.div>
    </section>
  )
}
