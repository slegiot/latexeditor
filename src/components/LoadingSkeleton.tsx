export function ProjectCardSkeleton() {
    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl skeleton" />
                <div className="flex-1">
                    <div className="h-4 w-32 skeleton mb-2" />
                    <div className="h-3 w-20 skeleton" />
                </div>
            </div>
            <div className="h-3 w-full skeleton mb-2" />
            <div className="h-3 w-2/3 skeleton" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="h-8 w-64 skeleton mb-2" />
                    <div className="h-4 w-40 skeleton" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function EditorSkeleton() {
    return (
        <div className="h-screen flex flex-col bg-surface-950">
            {/* Toolbar skeleton */}
            <div className="h-12 border-b border-surface-800/50 flex items-center px-4 gap-3">
                <div className="h-5 w-5 skeleton rounded" />
                <div className="h-4 w-32 skeleton" />
                <div className="flex-1" />
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-7 w-7 skeleton rounded-lg" />
                    ))}
                </div>
            </div>
            {/* Editor area skeleton */}
            <div className="flex-1 flex">
                <div className="flex-1 p-4 space-y-2">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="h-4 skeleton" style={{ width: `${40 + Math.random() * 50}%` }} />
                    ))}
                </div>
                <div className="w-px bg-surface-800/50" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-surface-600 text-sm">Loading preview…</div>
                </div>
            </div>
        </div>
    );
}
