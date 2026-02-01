import React, { useState, useRef, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
    const videoRef = useRef(null);
    const [isFading, setIsFading] = useState(false);

    // Auto-enter when video ends
    const handleVideoEnd = () => {
        setIsFading(true);
        setTimeout(onComplete, 800); // Wait for fade out
    };

    // Manual skip
    const handleSkip = () => {
        setIsFading(true);
        setTimeout(onComplete, 800);
    };

    // Ensure video plays (some browsers block autoplay without interaction, but usually strictly muted works)
    // We try to play with sound if possible, or muted if blocked.
    // For a splash screen, muted autoplay is safer.
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        }
    }, []);

    return (
        <div className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <video
                ref={videoRef}
                className="w-[50%] max-w-3xl rounded-3xl shadow-2xl shadow-emerald-500/10 object-contain aspect-square"
                src="/oracle_video.mp4"
                playsInline
                autoPlay
                muted
                onEnded={handleVideoEnd}
            />

            {/* Overlay Gradient for text readability if needed, or just click to skip */}
            <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors cursor-pointer flex flex-col items-center justify-end pb-12" onClick={handleSkip}>
                <div className="text-white/50 text-xs tracking-[0.3em] font-light animate-pulse uppercase">
                    Click to Enter
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
