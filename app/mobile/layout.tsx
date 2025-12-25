export default function MobileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Status Bar Shim */}
            <div className="h-[env(safe-area-inset-top)] bg-white w-full fixed top-0 z-50" />

            <main className="pt-[env(safe-area-inset-top)]">
                {children}
            </main>
        </div>
    )
}
