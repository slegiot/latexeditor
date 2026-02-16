export function ProjectCardSkeleton() {
    return (
        <div className="glass rounded-2xl p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-300)]/20" />
                <div className="w-16 h-4 rounded bg-[var(--color-surface-300)]/20" />
            </div>
            <div className="w-3/4 h-4 rounded bg-[var(--color-surface-300)]/20 mb-2" />
            <div className="w-1/2 h-3 rounded bg-[var(--color-surface-300)]/20 mb-4" />
            <div className="flex justify-between">
                <div className="w-20 h-3 rounded bg-[var(--color-surface-300)]/20" />
                <div className="w-12 h-3 rounded bg-[var(--color-surface-300)]/20" />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-dvh flex flex-col">
            {/* Navbar skeleton */}
            <div className="h-16 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-50)]" />

            <main className="flex-1 pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header skeleton */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-2">
                            <div className="w-64 h-8 rounded-lg bg-[var(--color-surface-300)]/20 animate-pulse" />
                            <div className="w-24 h-4 rounded bg-[var(--color-surface-300)]/20 animate-pulse" />
                        </div>
                        <div className="w-32 h-10 rounded-xl bg-[var(--color-surface-300)]/20 animate-pulse" />
                    </div>

                    {/* Grid skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ProjectCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export function EditorSkeleton() {
    return (
        <div className="h-dvh flex flex-col bg-[var(--color-surface-50)]">
            {/* Toolbar skeleton */}
            <div className="h-12 flex items-center justify-between px-3 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-50)]">
                <div className="flex items-center gap-3">
                    <div className="w-20 h-4 rounded bg-[var(--color-surface-300)]/20 animate-pulse" />
                    <div className="w-px h-5 bg-[var(--color-glass-border)]" />
                    <div className="w-32 h-4 rounded bg-[var(--color-surface-300)]/20 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-8 rounded-lg bg-[var(--color-surface-300)]/20 animate-pulse" />
                    <div className="w-16 h-8 rounded-lg bg-[var(--color-surface-300)]/20 animate-pulse" />
                </div>
            </div>

            {/* Editor + preview skeleton */}
            <div className="flex-1 flex">
                <div className="flex-1 bg-[var(--color-surface-100)] p-4 space-y-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-4 rounded bg-[var(--color-surface-300)]/10 animate-pulse"
                            style={{ width: `${30 + Math.random() * 60}%`, animationDelay: `${i * 50}ms` }}
                        />
                    ))}
                </div>
                <div className="w-px bg-[var(--color-glass-border)]" />
                <div className="flex-1 bg-[#525659] flex items-center justify-center">
                    <div className="text-[var(--color-surface-500)] text-sm animate-pulse">
                        Loading editor…
                    </div>
                </div>
            </div>
        </div>
    );
}
