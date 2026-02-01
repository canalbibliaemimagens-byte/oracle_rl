import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { X, Save, RotateCcw } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    const { sendCommand, lastMessage } = useWebSocket();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch config on open
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            sendCommand('GET_CONFIG');
        }
    }, [isOpen]);

    // Listen for config data
    useEffect(() => {
        if (lastMessage?.config) {
            setConfig(lastMessage.config);
            setLoading(false);
        }
    }, [lastMessage]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleSave = () => {
        sendCommand('SET_CONFIG', { config });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-slate-100">System Configuration</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse text-sm">Loading configuration...</div>
                    ) : (
                        <>
                            {/* Risk Limits */}
                            <section>
                                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 border-b border-slate-700/50 pb-2">Risk Management</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">DD Limit % (Pause)</label>
                                        <input
                                            type="number" step="0.1" name="dd_limit_pct" value={config.dd_limit_pct || ''} onChange={handleChange}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Emergency DD % (Stop)</label>
                                        <input
                                            type="number" step="0.1" name="dd_emergency_pct" value={config.dd_emergency_pct || ''} onChange={handleChange}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-rose-300 focus:ring-1 focus:ring-rose-500 outline-none transition-all focus:border-rose-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Global TP % (Close All)</label>
                                        <input
                                            type="number" step="0.1" name="dd_tp_pct" value={config.dd_tp_pct || 0} onChange={handleChange}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-emerald-300 focus:ring-1 focus:ring-emerald-500 outline-none transition-all focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-cyan-400">Lot Multiplier (Global)</label>
                                        <input
                                            type="number" step="0.1" min="1" name="lot_multiplier_global" value={config.lot_multiplier_global || 1} onChange={handleChange}
                                            className="w-full bg-slate-900 border border-cyan-700/50 rounded px-2.5 py-1.5 text-sm text-cyan-300 focus:ring-1 focus:ring-cyan-500 outline-none transition-all focus:border-cyan-500/50"
                                        />
                                        <p className="text-[9px] text-slate-500">Multiplies all lots (min 1.0)</p>
                                    </div>
                                </div>
                            </section>

                            {/* Stop Loss Settings */}
                            <section>
                                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 border-b border-slate-700/50 pb-2">Stop Loss Strategy</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox" id="use_atr_sl" name="use_atr_sl" checked={config.use_atr_sl || false} onChange={handleChange}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <label htmlFor="use_atr_sl" className="text-sm text-slate-300 font-medium cursor-pointer select-none">Enable ATR Stop Loss</label>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">ATR Period</label>
                                            <input
                                                type="number" name="atr_period" value={config.atr_period || 14} onChange={handleChange} disabled={!config.use_atr_sl}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">ATR Multiplier</label>
                                            <input
                                                type="number" step="0.1" name="atr_multiplier" value={config.atr_multiplier || 2} onChange={handleChange} disabled={!config.use_atr_sl}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Min SL (Pips)</label>
                                            <input
                                                type="number" name="sl_min_pips" value={config.sl_min_pips || 20} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Max SL (Pips)</label>
                                            <input
                                                type="number" name="sl_max_pips" value={config.sl_max_pips || 100} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Protection & System */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SL Protection */}
                                <section>
                                    <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 border-b border-slate-700/50 pb-2">SL Protection</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Max Hits</label>
                                            <input
                                                type="number" name="sl_max_hits" value={config.sl_max_hits || 1} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Window (Min)</label>
                                            <input
                                                type="number" name="sl_window_minutes" value={config.sl_window_minutes || 30} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* System Settings */}
                                <section>
                                    <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 border-b border-slate-700/50 pb-2">System Settings</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Magic Base</label>
                                            <input
                                                type="number" name="magic_base" value={config.magic_base || 0} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-400 font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Order Comment</label>
                                            <input
                                                type="text" name="comment_prefix" value={config.comment_prefix || 'Oracle'} onChange={handleChange}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-medium">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> Save Config
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
