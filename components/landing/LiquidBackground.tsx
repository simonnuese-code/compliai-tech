'use client'

import { motion, useScroll, useTransform } from 'motion/react'

export default function LiquidBackground() {
  const { scrollYProgress } = useScroll()

  // Parallax transforms for waves - Reduced movement
  const wave1Y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const wave2Y = useTransform(scrollYProgress, [0, 1], [0, -30])
  const wave3Y = useTransform(scrollYProgress, [0, 1], [0, -20])

  // Gradient shift on scroll - Simplified
  const gradientOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.9])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* Base Gradient - More Colorful */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: gradientOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white to-cyan-100/60" />
      </motion.div>

      {/* Animated Liquid Blobs - More Visible */}
      <motion.div
        className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-cyan-300/30 blur-[100px] will-change-transform"
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-1/4 -right-32 w-[700px] h-[700px] rounded-full bg-blue-300/30 blur-[100px] will-change-transform"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="hidden md:block absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-300/25 blur-[100px] will-change-transform"
        animate={{
          x: [0, 40, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Wave SVGs with Parallax - Reduced Opacity */}
      <motion.div
        className="absolute bottom-0 left-0 w-full opacity-30"
        style={{ y: wave1Y }}
      >
        <svg
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="url(#wave1-gradient)"
          />
          <defs>
            <linearGradient id="wave1-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-0 w-full opacity-25"
        style={{ y: wave2Y }}
      >
        <svg
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="url(#wave2-gradient)"
          />
          <defs>
            <linearGradient id="wave2-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}
