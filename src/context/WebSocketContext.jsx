import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const WebSocketContext = createContext(null);

// Supabase config for dynamic WS URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://erinxuykijsydorlgjgy.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_Mx32agJnSRh3sx-b_x6heg_YyqKPMCO';

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [systemState, setSystemState] = useState(null);
    const [symbolsState, setSymbolsState] = useState({});
    const [analyticsData, setAnalyticsData] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [wsUrl, setWsUrl] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);

    const socketRef = useRef(null);

    // Fallback URL and token from env
    const FALLBACK_WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8765';
    const WS_TOKEN = import.meta.env.VITE_WS_TOKEN || 'token_usuario_1';
    const RECONNECT_DELAY = 5000;

    // Fetch dynamic WS URL from Supabase
    const fetchWsUrl = async () => {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/tunnel_config?service_name=eq.rlmachine-ws&select=ws_url,wss_url`,
                {
                    headers: { 'apikey': SUPABASE_KEY }
                }
            );

            if (!response.ok) throw new Error('Supabase fetch failed');

            const data = await response.json();
            if (data && data.length > 0) {
                // Use wss:// for HTTPS pages, ws:// for HTTP
                const isSecure = window.location.protocol === 'https:';
                const url = isSecure ? data[0].wss_url : data[0].ws_url;
                console.log(`[WS] Got URL from Supabase: ${url}`);
                return url;
            }
        } catch (err) {
            console.warn('[WS] Failed to fetch from Supabase, using fallback:', err.message);
        }
        return null;
    };

    useEffect(() => {
        let ws = null;
        let reconnectTimeout = null;
        let isExpectedClose = false;

        const connect = async () => {
            // Get dynamic URL or use fallback
            let url = await fetchWsUrl();
            if (!url) {
                url = FALLBACK_WS_URL;
                console.log(`[WS] Using fallback URL: ${url}`);
            }
            setWsUrl(url);
            setConnectionError(null);

            // Close existing
            if (ws) ws.close();

            console.log(`[WS] Connecting to ${url}...`);
            ws = new WebSocket(url);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('[WS] Connected to RL Machine');
                setIsConnected(true);
                setConnectionError(null);

                // Send auth token
                if (WS_TOKEN) {
                    ws.send(JSON.stringify({ token: WS_TOKEN }));
                }
            };

            ws.onclose = (event) => {
                console.log(`[WS] Disconnected: Code ${event.code}`);
                setIsConnected(false);
                socketRef.current = null;

                if (!isExpectedClose) {
                    console.log(`[WS] Reconnecting in ${RECONNECT_DELAY}ms...`);
                    reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
                }
            };

            ws.onerror = (err) => {
                console.error('[WS] Error:', err);
                setConnectionError('Connection failed');
                ws.close();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastMessage(message);

                    // Auth response
                    if (message.status === 'authenticated') {
                        console.log('[WS] Authenticated successfully');
                        // Request initial state
                        ws.send(JSON.stringify({ type: 'GET_STATE' }));
                        return;
                    }

                    if (message.error === 'Invalid token') {
                        console.error('[WS] Invalid token!');
                        setConnectionError('Invalid token');
                        return;
                    }

                    if (message.type === 'full_state') {
                        setSystemState(message.data.system);
                        setSymbolsState(message.data.symbols);
                    }
                    else if (message.type === 'symbol_update') {
                        const { symbol, data } = message;
                        if (symbol && data) {
                            setSymbolsState(prev => ({
                                ...prev,
                                [symbol]: { ...prev[symbol], ...data }
                            }));
                        }
                    }
                    else if (message.type === 'tick') {
                        if (message.data.system) {
                            setSystemState(prev => ({ ...prev, ...message.data.system }));
                        }
                        if (message.data.positions) {
                            setSymbolsState(prev => {
                                const next = { ...prev };
                                const openPositions = message.data.positions;

                                Object.entries(openPositions).forEach(([sym, posData]) => {
                                    if (next[sym]) {
                                        next[sym] = {
                                            ...next[sym],
                                            position: { ...next[sym].position, ...posData }
                                        };
                                    }
                                });

                                Object.keys(next).forEach(sym => {
                                    if (!openPositions[sym] && next[sym]?.position?.size > 0) {
                                        next[sym] = {
                                            ...next[sym],
                                            position: { direction: '', size: 0, pnl: 0, pnl_pips: 0, open_price: 0 }
                                        };
                                    }
                                });
                                return next;
                            });
                        }
                        if (message.data.symbol_updates) {
                            setSymbolsState(prev => {
                                const next = { ...prev };
                                Object.entries(message.data.symbol_updates).forEach(([sym, data]) => {
                                    if (next[sym]) {
                                        next[sym] = { ...next[sym], ...data };
                                    }
                                });
                                return next;
                            });
                        }
                    }
                    // v4.5.1: MODEL_LOADED event - add new symbol card
                    else if (message.event === 'MODEL_LOADED') {
                        const { symbol, timeframe, status, n_states } = message.data;
                        console.log(`[WS] Model loaded: ${symbol}`);
                        setSymbolsState(prev => ({
                            ...prev,
                            [symbol]: {
                                status: status || 'WARMUP',
                                timeframe: timeframe || 'M15',
                                n_states: n_states,
                                position: { direction: '', size: 0, pnl: 0, pnl_pips: 0, open_price: 0 },
                                prediction: { hmm_state: '-', action: 'WAIT' },
                                stats: { win_rate: 0, trades: 0 }
                            }
                        }));
                    }
                    // v4.5.1: MODEL_UNLOADED event - remove symbol card
                    else if (message.event === 'MODEL_UNLOADED') {
                        const { symbol } = message.data;
                        console.log(`[WS] Model unloaded: ${symbol}`);
                        setSymbolsState(prev => {
                            const next = { ...prev };
                            delete next[symbol];
                            return next;
                        });
                    }
                    // Handle command responses (type: "response")
                    else if (message.type === 'response') {
                        console.log('[WS] Response received:', message.cmd, message);
                        if (message.cmd === 'GET_AVAILABLE_MODELS' && message.available_models) {
                            setAvailableModels(message.available_models);
                        }
                    }
                    else if (message.cmd === 'GET_AVAILABLE_MODELS' && message.available_models) {
                        setAvailableModels(message.available_models);
                    }
                    else if (message.cmd === 'GET_ANALYTICS') {
                        if (message.error) {
                            setAnalyticsData({ error: message.error });
                        } else if (message.analytics) {
                            setAnalyticsData(message.analytics);
                        }
                    }
                    else if (message.analytics) {
                        setAnalyticsData(message.analytics);
                    }
                } catch (e) {
                    console.error('[WS] Parse error:', e);
                }
            };
        };

        connect();

        return () => {
            isExpectedClose = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
        };
    }, []);

    const sendCommand = (type, data = {}) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, ...data }));
        }
    };

    return (
        <WebSocketContext.Provider value={{
            isConnected,
            systemState,
            symbolsState,
            analyticsData,
            sendCommand,
            lastMessage,
            wsUrl,
            connectionError,
            availableModels
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
