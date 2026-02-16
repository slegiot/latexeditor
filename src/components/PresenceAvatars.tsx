"use client";

import { getInitials } from "@/lib/presence-colors";
import type { Peer } from "@/hooks/useYjs";

interface PresenceAvatarsProps {
    peers: Peer[];
    connected: boolean;
    localClientId?: number;
}

export function PresenceAvatars({ peers, connected, localClientId }: PresenceAvatarsProps) {
    // Dedupe by email, prefer non-local
    const uniquePeers = peers.reduce<Peer[]>((acc, peer) => {
        if (!acc.find((p) => p.email === peer.email)) {
            acc.push(peer);
        }
        return acc;
    }, []);

    return (
        <div className="flex items-center gap-1.5">
            {/* Connection indicator */}
            <div className="flex items-center gap-1 mr-1">
                <div
                    className={`w-2 h-2 rounded-full transition-colors ${connected
                            ? "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                            : "bg-amber-400 animate-pulse"
                        }`}
                />
                <span className="text-[10px] text-[var(--color-surface-500)] hidden sm:inline">
                    {connected ? "Live" : "Reconnecting…"}
                </span>
            </div>

            {/* Avatars */}
            <div className="flex -space-x-1.5">
                {uniquePeers.map((peer) => {
                    const isLocal = peer.clientId === localClientId;
                    return (
                        <div
                            key={peer.clientId}
                            className="relative group"
                        >
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[var(--color-surface-50)] transition-transform hover:scale-110 hover:z-10"
                                style={{ backgroundColor: peer.color }}
                                title={isLocal ? `${peer.name} (you)` : peer.name}
                            >
                                {getInitials(peer.name)}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-[var(--color-surface-900)] text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {isLocal ? `${peer.name} (you)` : peer.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {uniquePeers.length > 1 && (
                <span className="text-[10px] text-[var(--color-surface-500)] ml-1">
                    {uniquePeers.length} online
                </span>
            )}
        </div>
    );
}
