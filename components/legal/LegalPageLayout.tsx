'use client'

import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import LiquidBackground from '@/components/landing/LiquidBackground'
import { motion } from 'motion/react'

interface LegalPageLayoutProps {
    children: React.ReactNode
    title: string
}

export default function LegalPageLayout({ children, title }: LegalPageLayoutProps) {
    return (
        <main className="relative min-h-screen">
            <LiquidBackground />
            <Navigation />

            <div className="pt-32 pb-24 px-4 md:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="backdrop-blur-xl bg-white/40 rounded-3xl p-8 md:p-12 border border-white/40 shadow-xl"
                    >
                        <div className="prose prose-sm max-w-none text-slate-600 prose-headings:font-semibold prose-headings:text-slate-900 prose-headings:mb-2 prose-headings:mt-4 prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0 prose-p:leading-normal prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
