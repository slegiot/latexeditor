export function ProjectCardSkeleton() {
    return (
        <div className="card-glass p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl animate-shimmer" />
                <div className="w-16 h-4 rounded-lg animate-shimmer" />
            </div>
            <div className="w-3/4 h-5 rounded-lg animate-shimmer mb-2" />
            <div className="w-1/2 h-3 rounded animate-shimmer mb-4" />
            <div className="pt-3 border-t border-[var(--color-glass-border)] flex justify-between">
                <div className="w-20 h-3 rounded animate-shimmer" />
                <div className="w-14 h-3 rounded animate-shimmer" />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)]">
            {/* Navbar skeleton */}
            <div className="h-16 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-50)]" />

            <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header skeleton */}
                    <div className="flex items-end justify-between mb-8">
                        <div className="space-y-3">
                            <div className="w-72 h-9 rounded-xl animate-shimmer" />
                            <div className="w-36 h-4 rounded-lg animate-shimmer" />
                        </div>
                        <div className="w-36 h-10 rounded-xl animate-shimmer" />
                    </div>

                    {/* Search skeleton */}
                    <div className="w-full max-w-md h-10 rounded-xl animate-shimmer mb-6" />

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
                    <div className="w-20 h-4 rounded-lg animate-shimmer" />
                    <div className="w-px h-5 bg-[var(--color-glass-border)]" />
                    <div className="w-36 h-4 rounded-lg animate-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-8 rounded-lg animate-shimmer" />
                    <div className="w-16 h-8 rounded-lg animate-shimmer" />
                    <div className="w-8 h-8 rounded-lg animate-shimmer" />
                    <div className="w-8 h-8 rounded-lg animate-shimmer" />
                </div>
            </div>

            {/* Editor + preview skeleton */}
            <div className="flex-1 flex">
                <div className="flex-1 bg-[#0c1117] p-4 space-y-3">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-4 rounded animate-shimmer"
                            style={{ width: `${30 + Math.random() * 60}%`, animationDelay: `${i * 80}ms` }}
                        />
                    ))}
                </div>
                <div className="w-px bg-[var(--color-glass-border)]" />
                <div className="flex-1 bg-[#525659] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl animate-shimmer mx-auto mb-3" />
                        <div className="w-32 h-4 rounded animate-shimmer mx-auto" />
                    </div>
                </div>
            </div>

            {/* Status bar skeleton */}
            <div className="h-7 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-100)] flex items-center px-3 gap-4">
                <div className="w-16 h-3 rounded animate-shimmer" />
                <div className="w-20 h-3 rounded animate-shimmer" />
            </div>
        </div>
    );
}
