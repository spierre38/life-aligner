'use client';

/**
 * app/todo/page.tsx — Responsive routing shell
 *
 * Desktop (≥ 768px): Yellow Pad experience — the original themed notepad UI
 *                    with drag-to-reorder, CSV export, and sub-goals.
 *
 * Mobile (< 768px):  Life Inbox — categorized tasks, deadline buckets
 *                    (Today / Tomorrow / This Week / Someday), swipe-to-complete,
 *                    and haptic feedback.
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load both experiences to avoid loading the full Yellow Pad on mobile
// or the full Inbox on desktop.
const DesktopTodoPad = dynamic(() => import('./DesktopTodoPad'), { ssr: false });
const MobileInbox    = dynamic(() => import('./MobileInbox'),    { ssr: false });

export default function TodoPage() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Show nothing while we detect screen size (avoids flash)
    if (isMobile === null) return null;

    return isMobile ? <MobileInbox /> : <DesktopTodoPad />;
}