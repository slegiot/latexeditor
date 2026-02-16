"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getPresenceColor } from "@/lib/presence-colors";

export interface Peer {
    clientId: number;
    name: string;
    email: string;
    color: string;
    colorLight: string;
}

interface UseYjsOptions {
    /** Project ID used as room name */
    projectId: string;
    /** Supabase access token for WS auth */
    accessToken: string;
    /** User info for awareness */
    user: {
        name: string;
        email: string;
    };
}

const WS_URL = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_YJS_WS_URL || "ws://localhost:4444")
    : "";

export function useYjs({ projectId, accessToken, user }: UseYjsOptions) {
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState<Peer[]>([]);

    const docRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);

    // Stable colour for this user
    const userColor = getPresenceColor(user.email);

    useEffect(() => {
        if (!projectId || !accessToken) return;

        const doc = new Y.Doc();
        const roomName = `project:${projectId}`;
        const wsUrl = `${WS_URL}`;

        const provider = new WebsocketProvider(wsUrl, roomName, doc, {
            params: { token: accessToken },
            connect: true,
            // Reconnect with backoff
            maxBackoffTime: 10000,
        });

        docRef.current = doc;
        providerRef.current = provider;

        // Set local awareness state
        provider.awareness.setLocalStateField("user", {
            name: user.name,
            email: user.email,
            color: userColor.color,
            colorLight: userColor.light,
        });

        // Connection status
        provider.on("status", (event: { status: string }) => {
            setConnected(event.status === "connected");
        });

        // Track peers from awareness
        const updatePeers = () => {
            const states = provider.awareness.getStates();
            const peerList: Peer[] = [];

            states.forEach((state, clientId) => {
                if (!state.user) return;
                peerList.push({
                    clientId,
                    name: state.user.name || "Anonymous",
                    email: state.user.email || "",
                    color: state.user.color || "#888",
                    colorLight: state.user.colorLight || "#88888833",
                });
            });

            setPeers(peerList);
        };

        provider.awareness.on("change", updatePeers);
        // Initial update
        updatePeers();

        return () => {
            provider.awareness.off("change", updatePeers);
            provider.disconnect();
            provider.destroy();
            doc.destroy();
            docRef.current = null;
            providerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, accessToken]);

    /** Get the shared Y.Text for "content" */
    const getYText = useCallback(() => {
        return docRef.current?.getText("content") ?? null;
    }, []);

    /** Get the Y.Doc */
    const getDoc = useCallback(() => {
        return docRef.current;
    }, []);

    /** Get the awareness instance */
    const getAwareness = useCallback(() => {
        return providerRef.current?.awareness ?? null;
    }, []);

    /** Get current text content as string */
    const getContent = useCallback(() => {
        return docRef.current?.getText("content")?.toString() ?? "";
    }, []);

    return {
        connected,
        peers,
        getYText,
        getDoc,
        getAwareness,
        getContent,
        userColor,
    };
}
