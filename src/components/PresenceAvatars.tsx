"use client";

interface Peer {
    name: string;
    color: string;
}

interface PresenceAvatarsProps {
    peers: Peer[];
    className?: string;
    maxDisplay?: number;
}

export function PresenceAvatars({
    peers,
    className = "",
    maxDisplay = 3,
}: PresenceAvatarsProps) {
    if (peers.length === 0) return null;

    const displayPeers = peers.slice(0, maxDisplay);
    const remainingCount = peers.length - maxDisplay;

    return (
        <div className={`flex items-center ${className}`}>
            <div className="flex -space-x-2">
                {displayPeers.map((peer, index) => (
                    <div
                        key={index}
                        className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-[var(--bg-secondary)]"
                        style={{ backgroundColor: peer.color }}
                        title={peer.name}
                    >
                        {getInitials(peer.name)}
                        <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-secondary)]"
                            style={{ backgroundColor: peer.color }}
                        />
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-2 border-[var(--bg-secondary)]"
                        title={`${remainingCount} more collaborator${remainingCount > 1 ? "s" : ""}`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
