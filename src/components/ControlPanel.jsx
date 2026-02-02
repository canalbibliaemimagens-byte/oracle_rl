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
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 md:mb-0">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                        <Settings size={20} className="text-slate-400" />
                        Controls
                    </h2>
                </div>

                {/* Mobile: horizontal scroll, Desktop: flex wrap */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2 md:pb-0 md:overflow-visible md:flex-wrap scrollbar-hide">
                    {/* Settings */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>

                    {/* Load Model (New) */}
                    <button
                        onClick={() => setIsLoadModelOpen(true)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
                        title="Load New Model"
                    >
                        <Hash size={20} />
                    </button>

                    {/* Reload Models */}
                    <button
                        onClick={handleReloadAll}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                        title="Reload AI Models"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <div className="h-6 w-px bg-slate-700 mx-1 flex-shrink-0 hidden md:block"></div>

                    {/* Pause/Resume */}
                    <button
                        onClick={handleTogglePause}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all flex-shrink-0 text-sm ${isRunning
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            }`}
                    >
                        {isRunning ? <><Pause size={16} /> <span className="hidden sm:inline">Pause</span></> : <><Play size={16} /> <span className="hidden sm:inline">Resume</span></>}
                    </button>

                    {/* Close All */}
                    <button
                        onClick={handleCloseAll}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all flex-shrink-0 text-sm"
                    >
                        <RefreshCw size={16} /> <span className="hidden sm:inline">Close All</span>
                    </button>

                    {/* Emergency Stop */}
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex-shrink-0 text-sm"
                        >
                            <Octagon size={16} /> <span className="hidden sm:inline">Emergency</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 flex-shrink-0">
                            <span className="text-xs font-bold text-red-500 whitespace-nowrap">Sure?</span>
                            <button
                                onClick={handleEmergencyStop}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-lg text-xs font-bold"
                            >
                                YES
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                            >
                                No
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
