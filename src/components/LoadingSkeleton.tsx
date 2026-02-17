"use client";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-[var(--bg-tertiary)] rounded ${className}`}
        />
    );
}

export function ProjectCardSkeleton() {
    return (
        <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(count)].map((_, i) => (
                <ProjectCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function EditorSkeleton() {
    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Toolbar Skeleton */}
            <div className="h-14 border-b border-[var(--border-secondary)] flex items-center px-4 gap-4">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <div className="flex-1" />
                <Skeleton className="w-24 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            {/* Editor Area Skeleton */}
            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-64 border-r border-[var(--border-secondary)] p-4 hidden lg:block">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-4">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>

                {/* Preview */}
                <div className="w-1/2 border-l border-[var(--border-secondary)] p-4 hidden xl:block">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Navbar Skeleton */}
            <div className="h-16 border-b border-[var(--border-secondary)] flex items-center px-4 sm:px-6 lg:px-8">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-32 ml-3" />
                <div className="flex-1" />
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            {/* Content */}
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card p-4 flex items-center gap-4">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div>
                                    <Skeleton className="h-6 w-12 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <Skeleton className="h-10 w-full max-w-md mb-6 rounded-lg" />

                    {/* Projects Grid */}
                    <ProjectsGridSkeleton />
                </div>
            </main>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex gap-4 pb-4 border-b border-[var(--border-secondary)]">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            <div className="space-y-4 pt-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
    return (
        <div className="space-y-4">
            {[...Array(fields)].map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
            <Skeleton className="h-10 w-full rounded-lg mt-6" />
        </div>
    );
}
