import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { X, Save, Settings } from 'lucide-react';

const SymbolConfigModal = ({ isOpen, onClose, symbol }) => {
    const { sendCommand, lastMessage } = useWebSocket();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch config on open
    useEffect(() => {
        if (isOpen && symbol) {
            setLoading(true);
            sendCommand('GET_SYMBOL_CONFIG', { symbol });
        }
    }, [isOpen, symbol]);

    // Listen for config data
    useEffect(() => {
        if (lastMessage?.config && lastMessage?.symbol === symbol) {
            setConfig(lastMessage.config);
            setLoading(false);
        } else if (lastMessage?.error && lastMessage?.status === 'ERROR') {
            // If config doesn't exist, we might want to handle it (e.g. init defaults)
            // But backend creates default if getting.
            if (loading) setLoading(false);
        }
    }, [lastMessage, symbol]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : parseFloat(value)) : value)
        }));
    };

    const handleSave = () => {
        // Ensure values are correct types
        const cleanConfig = {
            enabled: config.enabled,
            lot_multiplier: config.lot_multiplier !== '' && config.lot_multiplier !== null ? parseFloat(config.lot_multiplier) : null,
            sl_max_pips: config.sl_max_pips !== '' && config.sl_max_pips !== null ? parseFloat(config.sl_max_pips) : null
        };

        if (cleanConfig.lot_multiplier === null) {
            // Simple validation
            alert("Lot Multiplier is required");
            return;
        }

        sendCommand('SET_SYMBOL_CONFIG', {
            symbol,
            config: cleanConfig
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Settings size={18} className="text-slate-400" />
                        Config: <span className="text-blue-400">{symbol}</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500 animate-pulse text-sm">Loading config...</div>
                    ) : (
                        <>
                            {/* Enabled Toggle */}
                            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                <label htmlFor="enabled_toggle" className="text-sm font-medium text-slate-300">Enable Trading</label>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="enabled"
                                        id="enabled_toggle"
                                        checked={config?.enabled || false}
                                        onChange={handleChange}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-slate-400 border-4 appearance-none cursor-pointer checked:right-0 checked:bg-blue-500 transition-all duration-300"
                                    />
                                    <label htmlFor="enabled_toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-700 cursor-pointer"></label>
                                </div>
                            </div>

                            {/* Settings Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Lot Multiplier (x)</label>
                                    <input
                                        type="number" step="0.1" min="0.1" name="lot_multiplier"
                                        value={config?.lot_multiplier ?? ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 1.0"
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-slate-500">Multiplies base lot (0.01/0.03/0.05)</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Max SL (Pips) <span className="text-slate-600 font-normal normal-case">(Optional)</span></label>
                                    <input
                                        type="number" step="1" min="10" name="sl_max_pips"
                                        value={config?.sl_max_pips ?? ''}
                                        onChange={handleChange}
                                        placeholder="Global Default"
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-slate-500">Overrides global SL limit if set</p>
                                </div>

                                <div className="space-y-1 opacity-60">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Timeframe (Read-only)</label>
                                    <input
                                        type="text"
                                        value={config?.timeframe || '?'}
                                        disabled
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-mono"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-medium text-sm">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                    >
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SymbolConfigModal;
