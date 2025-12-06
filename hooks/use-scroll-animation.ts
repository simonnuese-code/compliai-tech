'use client'

import { useInView } from 'motion/react'
import { useRef } from 'react'

export function useScrollAnimation(options?: { margin?: string; once?: boolean }) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: (options?.margin ?? '-100px') as any,
  })

  return { ref, isInView }
}
