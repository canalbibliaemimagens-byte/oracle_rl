import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import {
    ArrowUp, ArrowDown, Activity, TrendingUp, TrendingDown,
    Clock, RefreshCw, PlayCircle, Ban, XCircle, FastForward,
    Target, Brain, Settings
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import SymbolConfigModal from './SymbolConfigModal';

const SymbolCard = ({ symbol, data }) => {
    const { sendCommand } = useWebSocket();

    // Destructure Safe Data
    const position = data?.position || { size: 0, pnl: 0, direction: 'FLAT', pnl_pips: 0, open_price: 0 };
    const status = data?.status || 'UNKNOWN';
    const prediction = data?.prediction || { hmm_state: '-', action: 'WAIT' };
    const stats = data?.stats || { win_rate: 0, trades: 0 };
    const timeframe = data?.timeframe || 'M15';
    // const last_update = data?.last_update || new Date().toISOString(); // Not used in new design

    // Map to UI variables
    const hmm_state = prediction.hmm_state;
    const last_action = prediction.action;

    // Action State
    const [confirmAction, setConfirmAction] = useState(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Helpers
    const getStatusColor = (s) => {
        switch (s) {
            case 'NORMAL': return 'bg-emerald-500';
            case 'WARMUP': return 'bg-amber-500';
            case 'BLOCKED': return 'bg-rose-500';
            default: return 'bg-slate-500';
        }
    };

    const hasPosition = position && position.size > 0;
    const isLong = position.direction === 'LONG';
    const pnlColor = position.pnl >= 0 ? "text-emerald-400" : "text-rose-400";
    const pipsColor = position.pnl_pips >= 0 ? "text-emerald-400" : "text-rose-400";

    // --- Action Handlers (Kept same logic) ---
    const handleClosePosition = () => {
        setConfirmAction({
            type: 'CLOSE_POSITION',
            title: 'Close Position?',
            message: `Are you sure you want to close the position for ${symbol}?`,
            variant: 'warning'
        });
    };

    const handleReload = () => {
        setConfirmAction({
            type: 'RELOAD_MODEL',
            title: 'Reload Model?',
            message: `Are you sure you want to reload the model for ${symbol}?`,
            variant: 'info'
        });
    };

    const handleToggleBlock = () => {
        if (status === 'BLOCKED') {
            setConfirmAction({ type: 'UNBLOCK', title: 'Unblock Symbol?', message: `Unblock ${symbol}?`, variant: 'info' });
        } else if (status === 'WARMUP') {
            setConfirmAction({ type: 'FORCE_NORMAL', title: 'Force Normal?', message: `Force ${symbol} to NORMAL?`, variant: 'warning' });
        } else {
            setConfirmAction({ type: 'BLOCK', title: 'Block Symbol?', message: `Block ${symbol}?`, variant: 'danger' });
        }
    };

    const executeAction = () => {
        if (!confirmAction) return;
        const actions = {
            'UNBLOCK': 'UNBLOCK_SYMBOL',
            'FORCE_NORMAL': 'FORCE_NORMAL',
            'BLOCK': 'BLOCK_SYMBOL',
            'CLOSE_POSITION': 'CLOSE_POSITION',
            'RELOAD_MODEL': 'RELOAD_MODEL'
        };
        if (actions[confirmAction.type]) {
            sendCommand(actions[confirmAction.type], { symbol });
        }
        setConfirmAction(null);
    };

    return (
        <>
            <div className={`relative group rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg p-3 flex flex-col justify-between min-h-[220px] ${status === 'BLOCKED' ? 'bg-slate-900/40 border-slate-800 opacity-75' : 'bg-slate-800/40 border-slate-700/50'
                }`}>

                {/* Header: Dot + Symbol + Timeframe */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(status)} shadow-[0_0_6px_rgba(0,0,0,0.3)]`} />
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{symbol}</h3>
                    <span className="ml-auto text-[10px] font-bold text-slate-600 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/50">
                        {timeframe}
                    </span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-center mb-2">
                    {hasPosition ? (
                        <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700/50 relative overflow-hidden flex items-center justify-between gap-1">

                            {/* Left: Direction Icon */}
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${isLong ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {isLong ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            </div>

                            {/* Center: Action & Price */}
                            <div className="flex flex-col items-start leading-none ml-1">
                                <div className="text-[10px] font-bold whitespace-nowrap">
                                    <span className={isLong ? 'text-emerald-500' : 'text-rose-500'}>
                                        {isLong ? 'BUY' : 'SELL'}
                                    </span>
                                    <span className="text-slate-200 ml-1">{position.size}</span>
                                </div>
                                <div className="text-[8px] text-slate-500 font-mono mt-0.5 whitespace-nowrap tracking-tight">
                                    @ {position.open_price}
                                </div>
                            </div>

                            {/* Right: PnL & Pips */}
                            <div className="flex flex-col items-end text-right ml-auto min-w-max">
                                <div className={`text-xs font-bold leading-none mb-0.5 ${pnlColor}`}>
                                    {position.pnl > 0 ? '+' : ''}{(position.pnl || 0).toFixed(2)}
                                </div>
                                <div className={`text-[8px] font-bold ${pipsColor}`}>
                                    {(position.pnl_pips || 0) > 0 ? '+' : ''}{(position.pnl_pips || 0).toFixed(1)} pips
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-5 border border-dashed border-slate-800 rounded-lg bg-slate-900/20">
                            <span className="text-slate-600 font-medium text-xs flex items-center justify-center gap-1.5">
                                <Minus size={12} className="opacity-50" /> No Position
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer: HMM & Action */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* HMM State */}
                    <div className="bg-slate-900/60 rounded p-1.5 border border-slate-700/30 flex flex-col items-center justify-center relative overflow-hidden min-h-[42px]">
                        <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5 z-10">HMM State</div>
                        <div className="flex items-baseline gap-1 z-10 leading-none">
                            <span className="text-[8px] text-slate-600 font-medium font-mono">STATE</span>
                            <span className="text-lg font-bold text-slate-200 font-mono">{hmm_state}</span>
                        </div>
                    </div>

                    {/* Last Action */}
                    <div className="bg-slate-900/60 rounded p-1.5 border border-slate-700/30 flex flex-col items-center justify-center relative overflow-hidden min-h-[42px]">
                        <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5 z-10">Last Action</div>
                        <div className={`text-sm font-bold font-mono z-10 leading-none ${last_action === 'BUY' ? 'text-emerald-400' :
                            last_action === 'SELL' ? 'text-rose-400' :
                                'text-slate-400'
                            }`}>
                            {last_action}
                        </div>
                    </div>
                </div>

                {/* Bottom Stats & Actions */}
                <div className="flex items-center justify-between text-[9px] text-slate-700 px-1 mt-auto pt-1 relative min-h-[18px]">
                    <div className="z-0">
                        WR: <span className="text-slate-500">{stats.win_rate}%</span>
                    </div>

                    {/* Actions (Centered & Hover) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-700/50 shadow-sm">
                        <button onClick={() => setIsConfigOpen(true)} className="p-0.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors" title="Settings">
                            <Settings size={10} />
                        </button>
                        <button onClick={handleReload} className="p-0.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors" title="Reload">
                            <RefreshCw size={10} />
                        </button>
                        {status === 'WARMUP' && (
                            <button onClick={handleToggleBlock} className="p-0.5 rounded text-amber-500 hover:text-amber-400 transition-colors" title="Force Normal">
                                <FastForward size={10} />
                            </button>
                        )}
                        <button onClick={handleToggleBlock} className={`p-0.5 rounded transition-colors ${status === 'BLOCKED' ? 'text-emerald-500 hover:text-emerald-400' : 'text-rose-500 hover:text-rose-400'}`} title={status === 'BLOCKED' ? "Unblock" : "Block"}>
                            {status === 'BLOCKED' ? <PlayCircle size={10} /> : <Ban size={10} />}
                        </button>
                        <button onClick={handleClosePosition} disabled={!hasPosition} className="p-0.5 rounded text-slate-400 hover:text-red-400 disabled:opacity-30 transition-colors" title="Close">
                            <XCircle size={10} />
                        </button>
                    </div>

                    <div className="z-0">
                        #{stats.trades}
                    </div>
                </div>

            </div>

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={executeAction}
                title={confirmAction?.title}
                message={confirmAction?.message}
                variant={confirmAction?.variant}
            />

            <SymbolConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                symbol={symbol}
            />
        </>
    );
};

// Helper for 'minus' icon in 'No Position'
const Minus = ({ size, className }) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default SymbolCard;
