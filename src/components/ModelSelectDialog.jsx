import React, { useState, useEffect } from 'react';
import { X, Check, Hash, Package, AlertCircle } from 'lucide-react';

const ModelSelectDialog = ({ isOpen, onClose, onSubmit, availableModels = [], loadedSymbols = [] }) => {
    const [selected, setSelected] = useState(null);

    // Debug log
    console.log('[ModelSelectDialog] availableModels:', availableModels);
    console.log('[ModelSelectDialog] loadedSymbols:', loadedSymbols);

    // Filter out models whose symbol is already loaded
    // Model folder format: SYMBOL_TIMEFRAME_VERSION (e.g., EURUSD_M15_v1)
    // loadedSymbols contains: ["EURUSD", "GBPUSD", ...]
    const unloadedModels = availableModels.filter(modelFolder => {
        // Extract symbol from folder name (first part before underscore)
        const symbol = modelFolder.split('_')[0];
        return !loadedSymbols.includes(symbol);
    });

    console.log('[ModelSelectDialog] unloadedModels:', unloadedModels);

    useEffect(() => {
        if (isOpen) setSelected(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selected) {
            onSubmit(selected);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                        <Hash size={18} className="text-emerald-400" />
                        Load AI Model
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4">
                    {availableModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle size={48} className="text-amber-400 mb-4" />
                            <p className="text-lg font-bold text-slate-200 mb-2">No Models Found</p>
                            <p className="text-sm text-slate-400">
                                No model folders found in models/ directory.
                            </p>
                        </div>
                    ) : unloadedModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle size={48} className="text-amber-400 mb-4" />
                            <p className="text-lg font-bold text-slate-200 mb-2">All Models Loaded</p>
                            <p className="text-sm text-slate-400">
                                All {availableModels.length} available models are already loaded.
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                Loaded: {loadedSymbols.join(', ')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-400 mb-4">
                                Select a model to load ({unloadedModels.length} available):
                            </p>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                                {unloadedModels.map((model) => (
                                    <button
                                        key={model}
                                        type="button"
                                        onClick={() => setSelected(model)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selected === model
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        <Package size={18} className={selected === model ? 'text-emerald-400' : 'text-slate-500'} />
                                        <span className="font-mono text-sm">{model}</span>
                                        {selected === model && (
                                            <Check size={16} className="ml-auto text-emerald-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        {unloadedModels.length > 0 && (
                            <button
                                type="submit"
                                disabled={!selected}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                            >
                                <Check size={16} /> Load Model
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModelSelectDialog;
