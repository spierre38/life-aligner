'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPromptBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed permanently
        if (localStorage.getItem('la_install_dismissed') === 'true') return;
        // Don't show if already installed (running as PWA)
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        // Only show on mobile screen widths (< 768px)
        if (window.innerWidth >= 768) return;

        // Detect iOS
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setIsIOS(ios);

        if (ios) {
            // iOS can't use beforeinstallprompt — show our manual instructions after a delay
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Android/Chrome: listen for the native install prompt event
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Small delay so it doesn't pop immediately on page load
            setTimeout(() => setShowBanner(true), 3000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSModal(true);
            return;
        }
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem('la_install_dismissed', 'true');
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleMaybeLater = () => {
        setShowBanner(false);
        // Session-only hide (not permanent)
    };

    const handleDismiss = () => {
        localStorage.setItem('la_install_dismissed', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Install Banner */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 safe-bottom"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Gradient top bar */}
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm">Best on your Home Screen</p>
                                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Add to your home screen for the full app experience — no browser chrome, faster access</p>
                            </div>
                            <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-400 transition p-1 flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold transition hover:opacity-90"
                            >
                                📲 Install App
                            </button>
                            <button
                                onClick={handleMaybeLater}
                                className="px-4 py-2.5 bg-gray-800 text-slate-400 rounded-xl text-sm font-semibold hover:text-white transition"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSModal && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center p-4" onClick={() => setShowIOSModal(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">Add to Home Screen</h3>
                        <p className="text-slate-400 text-sm mb-5">Follow these steps in Safari:</p>
                        <div className="space-y-3">
                            {[
                                { step: '1', icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
                                { step: '2', icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
                                { step: '3', icon: '✅', text: 'Tap "Add" — the Tim Collins Framework app will appear on your home screen!' },
                            ].map(s => (
                                <div key={s.step} className="flex items-start gap-3">
                                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {s.step}
                                    </div>
                                    <p className="text-slate-300 text-sm">{s.icon} {s.text}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setShowIOSModal(false); handleDismiss(); }}
                            className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
