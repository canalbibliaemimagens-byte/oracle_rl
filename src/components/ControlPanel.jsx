import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Play, Pause, Octagon, Settings, RefreshCw, Hash } from 'lucide-react';
import SettingsModal from './SettingsModal';
import InputDialog from './InputDialog';

const ControlPanel = () => {
    const { systemState, sendCommand } = useWebSocket();
    const [isLoadModelOpen, setIsLoadModelOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const isRunning = systemState?.status === 'RUNNING';

    const handleTogglePause = () => sendCommand(isRunning ? 'PAUSE' : 'RESUME');
    const handleReloadAll = () => sendCommand('RELOAD_ALL_MODELS');
    const handleCloseAll = () => sendCommand('CLOSE_ALL');
    const handleEmergencyStop = () => {
        sendCommand('EMERGENCY_STOP');
        setShowConfirm(false);
    };

    const handleLoadModel = (path) => {
        if (path) sendCommand('LOAD_MODEL', { path });
    };

    return (
        <>
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                        <Settings size={20} className="text-slate-400" />
                        Controls
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Settings */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    {/* Load Model (New) */}
                    <button
                        onClick={() => setIsLoadModelOpen(true)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Load New Model"
                    >
                        <Hash size={20} />
                    </button>

                    {/* Reload Models */}
                    <button
                        onClick={handleReloadAll}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Reload AI Models"
                    >
                        <RefreshCw size={20} />
                    </button>

                    {/* Pause/Resume */}
                    <button
                        onClick={handleTogglePause}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isRunning
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            }`}
                    >
                        {isRunning ? <><Pause size={18} /> Pause System</> : <><Play size={18} /> Resume System</>}
                    </button>

                    {/* Close All */}
                    <button
                        onClick={handleCloseAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
                    >
                        <RefreshCw size={18} /> Close All Positions
                    </button>

                    {/* Emergency Stop */}
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                            <Octagon size={18} /> Emergency Stop
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm font-bold text-red-500">Are you sure?</span>
                            <button
                                onClick={handleEmergencyStop}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-lg text-sm font-bold"
                            >
                                CONFIRM
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <InputDialog
                isOpen={isLoadModelOpen}
                onClose={() => setIsLoadModelOpen(false)}
                onSubmit={handleLoadModel}
                title="Load New AI Model"
                message="Enter the folder name of the model you want to load (must exist in 'models/' directory):"
                placeholder="e.g. BTCUSD_H1_v2"
                icon={Hash}
            />
        </>
    );
};

export default ControlPanel;
