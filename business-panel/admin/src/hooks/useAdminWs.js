/**
 * useAdminWs — WebSocket hook for admin panel
 * Auto-connects using adminAuth token, reconnects on disconnect.
 * Returns: { lastMessage, connected }
 */
import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api";
const WS_BASE = API_URL.replace("/api", "").replace("http://", "ws://").replace("https://", "wss://");

export default function useAdminWs(onMessage) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const cbRef = useRef(onMessage);
    const mountedRef = useRef(true);
    cbRef.current = onMessage;

    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        try {
            const raw = localStorage.getItem("adminAuth");
            const auth = raw ? JSON.parse(raw) : null;
            if (!auth?.token) return;

            if (wsRef.current && wsRef.current.readyState < 2) return; // already open/connecting

            const tkn = encodeURIComponent(auth.token);
            const ws = new WebSocket(`${WS_BASE}/ws?token=${tkn}`);
            wsRef.current = ws;

            ws.onopen = () => { if (mountedRef.current) setConnected(true); };
            ws.onclose = () => {
                if (mountedRef.current) {
                    setConnected(false);
                    reconnectTimer.current = setTimeout(connect, 5000);
                }
            };
            ws.onerror = () => ws.close();
            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (cbRef.current) cbRef.current(msg);
                } catch { /* ignore non-JSON */ }
            };
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            clearTimeout(reconnectTimer.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    return { connected };
}
