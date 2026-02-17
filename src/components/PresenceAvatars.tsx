"use client";

import type { Peer } from "@/hooks/useYjs";

interface PresenceAvatarsProps {
    peers: Peer[];
    connected: boolean;
}

const AVATAR_COLORS = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
];

export function PresenceAvatars({ peers, connected }: PresenceAvatarsProps) {
    // Deduplicate peers by name
    const uniquePeers = peers.filter(
        (peer, index, self) => index === self.findIndex((p) => p.name === peer.name)
    );

    return (
        <div className="flex items-center gap-1.5" title={connected ? "Connected" : "Disconnected"}>
            <span className={`text-[10px] ${connected ? "text-success" : "text-surface-600"}`}>
                {connected ? "●" : "○"}
            </span>
            <div className="flex -space-x-1.5">
                {uniquePeers.slice(0, 4).map((peer, i) => (
                    <span
                        key={i}
                        title={peer.name}
                        className={`w-6 h-6 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-surface-900`}
                    >
                        {peer.name?.[0]?.toUpperCase() || "?"}
                    </span>
                ))}
                {uniquePeers.length > 4 && (
                    <span className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-[10px] text-surface-300 font-bold ring-2 ring-surface-900">
                        +{uniquePeers.length - 4}
                    </span>
                )}
            </div>
            {uniquePeers.length > 0 && (
                <span className="text-[11px] text-surface-500 hidden sm:inline">
                    {uniquePeers.length} online
                </span>
            )}
        </div>
    );
}
