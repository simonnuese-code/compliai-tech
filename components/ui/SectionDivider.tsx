import React from 'react'
import { cn } from '@/lib/utils'

interface SectionDividerProps {
    position: 'top' | 'bottom'
    variant: 'light-to-dark' | 'dark-to-light' | 'light-to-light' | 'dark-to-dark' | 'light-to-dark-blue' | 'dark-blue-to-light'
    className?: string
}

export default function SectionDivider({ position, variant, className }: SectionDividerProps) {
    // Colors matching the sections
    // Hero/Light: Transparent/White-ish
    // Problem/Dark: slate-950
    // Solution/LightBlue: slate-50/blue-50
    // HowItWorks/DarkBlue: slate-900
    // Features/Light: slate-100

    let fillClass = ''
    let gradientClass = ''

    // We need to match the color of the section *adjacent* to the divider.
    // If position is top, we are transitioning FROM the previous section TO the current section.
    // Actually, SVG dividers are usually placed inside the section, at the top or bottom, 
    // and their fill color matches the *adjacent* section to create the illusion of a shape.

    // Strategy: Place divider at the TOP of a section. 
    // The SVG shape should "point down" or "point up"?
    // Let's use a simple wave that fills the "gap".
    // If we are in Section B (Dark) and Section A (Light) is above:
    // We want the top of Section B to look like a wave.
    // So the SVG should be the color of Section B, sitting on top of Section A's bottom? 
    // Or the SVG is the color of Section A, sitting at the top of Section B?

    // Easier approach: The divider is a block at the boundary.
    // Let's assume we place this at the TOP of the current section.
    // The SVG path will be the color of the CURRENT section, creating a wave shape against the PREVIOUS section.

    if (variant === 'light-to-dark') {
        // Previous: Light, Current: Dark
        fillClass = 'fill-slate-950' // Match Problem Section
        gradientClass = 'from-transparent to-slate-950/20'
    } else if (variant === 'dark-to-light') {
        // Previous: Dark, Current: Light (Solution)
        fillClass = 'fill-blue-50/50' // Match Solution Section base
        gradientClass = 'from-slate-950/20 to-transparent'
    } else if (variant === 'light-to-dark-blue') {
        // Previous: Light (Solution), Current: Dark Blue (HowItWorks)
        fillClass = 'fill-slate-900'
        gradientClass = 'from-transparent to-slate-900/20'
    } else if (variant === 'dark-blue-to-light') {
        // Previous: Dark Blue (HowItWorks), Current: Light (Features)
        fillClass = 'fill-slate-50'
        gradientClass = 'from-slate-900/20 to-transparent'
    }

    return (
        <div
            className={cn(
                "absolute left-0 right-0 w-full overflow-hidden leading-[0] z-10 pointer-events-none",
                position === 'top' ? "-top-[1px]" : "-bottom-[1px]",
                className
            )}
        >
            {/* Gradient Overlay for Soft Transition */}
            <div className={cn("absolute inset-0 h-20 w-full bg-gradient-to-b", gradientClass)} />

            {/* Wave SVG */}
            <svg
                className={cn("relative block w-[calc(100%+1.3px)] h-[60px] md:h-[80px]", fillClass)}
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                {/* Soft organic wave with minimal amplitude */}
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
        </div>
    )
}
