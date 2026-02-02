import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const PWAUpdatePrompt = () => {
    const [showUpdate, setShowUpdate] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState(null);

    useEffect(() => {
        // Check if service worker API is available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                // Check for updates
                registration.update();

                // Listen for new service worker waiting
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowUpdate(true);
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setWaitingWorker(newWorker);
                                setShowUpdate(true);
                            }
                        });
                    }
                });
            });

            // Listen for controlling service worker change
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // Fallback: Force reload with cache clear
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            window.location.reload(true);
        }
    };

    // Manual refresh button always visible in production
    const handleForceRefresh = () => {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload(true);
    };

    if (!showUpdate) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-emerald-600/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg border border-emerald-400/50 flex items-center gap-3">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleUpdate}>
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm font-bold">New Version Available!</span>
                </div>
                <button
                    onClick={handleUpdate}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition-colors"
                >
                    Update Now
                </button>
                <button
                    onClick={() => setShowUpdate(false)}
                    className="hover:bg-emerald-700/50 rounded-full p-0.5 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

// Export a manual refresh function for use elsewhere
export const forceAppRefresh = () => {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
    window.location.reload(true);
};

export default PWAUpdatePrompt;
