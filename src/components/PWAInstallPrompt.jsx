import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg border border-blue-400/50 flex items-center gap-3">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleInstallClick}>
                    <Download size={16} />
                    <span className="text-sm font-bold">Install App</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="hover:bg-blue-700/50 rounded-full p-0.5 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
