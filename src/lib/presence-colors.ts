/**
 * Deterministic colour assignment for collaborator cursors.
 * Hash an email (or any string) to one of 8 distinct colours.
 */

const CURSOR_COLORS = [
    { color: "#10B981", light: "#10B98133", name: "emerald" },
    { color: "#3B82F6", light: "#3B82F633", name: "blue" },
    { color: "#F59E0B", light: "#F59E0B33", name: "amber" },
    { color: "#EF4444", light: "#EF444433", name: "red" },
    { color: "#8B5CF6", light: "#8B5CF633", name: "violet" },
    { color: "#EC4899", light: "#EC489933", name: "pink" },
    { color: "#14B8A6", light: "#14B8A633", name: "teal" },
    { color: "#F97316", light: "#F9731633", name: "orange" },
] as const;

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function getPresenceColor(identifier: string) {
    const idx = hashString(identifier) % CURSOR_COLORS.length;
    return CURSOR_COLORS[idx];
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export { CURSOR_COLORS };
