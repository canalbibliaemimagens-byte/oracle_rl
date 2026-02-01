import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Terminal, Trash2 } from 'lucide-react';

const LogViewer = () => {
    const { lastMessage } = useWebSocket();
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!lastMessage) return;

        const type = lastMessage.type;
        if (['tick', 'full_state'].includes(type) && !lastMessage.data?.event) return;

        // Process trade or event messages
        let newLog = null;
        const timestamp = new Date().toLocaleTimeString();

        if (type === 'trade') {
            const { symbol, action, pnl, size } = lastMessage.data;
            newLog = {
                id: Date.now(),
                time: timestamp,
                type: 'TRADE',
                message: `${action} ${symbol} (${size} lots) ${pnl ? `PnL: $${pnl.toFixed(2)}` : ''}`,
                color: pnl > 0 ? 'text-green-400' : (pnl < 0 ? 'text-red-400' : 'text-blue-400')
            };
        } else if (type === 'response') {
            newLog = {
                id: Date.now(),
                time: timestamp,
                type: 'CMD',
                message: `${lastMessage.cmd}: ${lastMessage.message || lastMessage.status}`,
                color: 'text-amber-400'
            };
        } else if (type === 'event' || lastMessage.data?.event_type) {
            // Custom events if any
        }

        if (newLog) {
            setLogs(prev => [...prev.slice(-49), newLog]);
        }

    }, [lastMessage]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Terminal size={14} /> Live Activity
                </h3>
                <button
                    onClick={() => setLogs([])}
                    className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                    title="Clear Logs"
                >
                    <Trash2 size={12} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-0.5 p-2 bg-slate-900/50 rounded-lg border border-slate-700/30 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-slate-600 text-center mt-20 text-xs">Waiting for activity...</div>
                )}
                {logs.map(log => (
                    <div key={log.id} className="flex gap-2 hover:bg-slate-800/50 rounded leading-tight">
                        <span className="text-slate-600 select-none min-w-[50px]">[{log.time}]</span>
                        <span className={`font-bold w-10 ${log.type === 'TRADE' ? 'text-blue-500' : 'text-amber-500'}`}>
                            {log.type}
                        </span>
                        <span className={`flex-1 break-words ${log.color}`}>{log.message}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LogViewer;
