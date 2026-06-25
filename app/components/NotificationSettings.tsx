'use client';

/**
 * NotificationSettings.tsx
 *
 * Handles the full Web Push notification opt-in flow:
 *   1. Check current permission state
 *   2. Request permission + subscribe to push
 *   3. Save subscription + time preference to API
 *   4. Allow toggling on/off and changing notification time
 */

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
];

function formatHour(h: number) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${ampm}`;
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export default function NotificationSettings() {
    const [permState, setPermState] = useState<PermissionState>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notifyHour, setNotifyHour] = useState(8);
    const [timezone, setTimezone] = useState('America/New_York');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermState('unsupported');
            return;
        }
        setPermState(Notification.permission as PermissionState);

        // Try to detect browser's stored notification time preference
        const stored = localStorage.getItem('notif_hour');
        if (stored) setNotifyHour(parseInt(stored, 10));
        const storedTz = localStorage.getItem('notif_tz');
        if (storedTz) setTimezone(storedTz);

        // Check if already subscribed
        navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
                setIsSubscribed(!!sub);
            });
        }).catch(() => {});
    }, []);

    const subscribe = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermState(permission as PermissionState);
            if (permission !== 'granted') return;

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub.toJSON(),
                    notifyHour,
                    notifyMinute: 0,
                    timezone,
                }),
            });

            localStorage.setItem('notif_hour', String(notifyHour));
            localStorage.setItem('notif_tz', timezone);
            setIsSubscribed(true);
            setSavedMsg('Notifications enabled ✓');
            setTimeout(() => setSavedMsg(''), 3000);
        } catch (err) {
            console.error('[NotificationSettings] subscribe error:', err);
        } finally {
            setLoading(false);
        }
    }, [notifyHour, timezone]);

    const unsubscribe = useCallback(async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
            }
            setIsSubscribed(false);
            setSavedMsg('Notifications disabled');
            setTimeout(() => setSavedMsg(''), 3000);
        } catch (err) {
            console.error('[NotificationSettings] unsubscribe error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveTimePreference = useCallback(async () => {
        setSaving(true);
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifyHour, timezone }),
            });
            localStorage.setItem('notif_hour', String(notifyHour));
            localStorage.setItem('notif_tz', timezone);
            setSavedMsg('Time saved ✓');
            setTimeout(() => setSavedMsg(''), 3000);
        } finally {
            setSaving(false);
        }
    }, [notifyHour, timezone]);

    // ── Unsupported ──────────────────────────────────────────────────────────────
    if (permState === 'unsupported') {
        return (
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Daily Notifications
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Push notifications require a modern browser and HTTPS. Try Chrome or Safari on iOS 16.4+.
                </p>
            </div>
        );
    }

    // ── Blocked ──────────────────────────────────────────────────────────────────
    if (permState === 'denied') {
        return (
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--color-surface)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
                <div className="flex items-start gap-3">
                    <span className="text-xl">🚫</span>
                    <div>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                            Notifications Blocked
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Notifications are blocked in your browser settings. To enable them, click the lock icon in your address bar and allow notifications for this site.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main card ────────────────────────────────────────────────────────────────
    return (
        <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
            {/* Header + toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Daily Life Inbox Digest
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {isSubscribed
                                ? `Enabled · Notifies at ${formatHour(notifyHour)}`
                                : 'Get a morning summary of your tasks'}
                        </p>
                    </div>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={loading}
                    id="notif-toggle-btn"
                    className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                    style={{
                        background: isSubscribed ? '#6366f1' : 'rgba(255,255,255,0.12)',
                        opacity: loading ? 0.6 : 1,
                    }}
                    aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
                >
                    <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                        style={{ left: isSubscribed ? '26px' : '2px' }}
                    />
                </button>
            </div>

            {/* Time picker (only show when subscribed) */}
            {isSubscribed && (
                <div className="space-y-3 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs pt-3" style={{ color: 'var(--color-text-dim)' }}>
                        Notification time
                    </p>

                    {/* Hour selector */}
                    <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                            Time of day
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[6, 7, 8, 9, 10, 12].map(h => (
                                <button
                                    key={h}
                                    onClick={() => setNotifyHour(h)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: notifyHour === h ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                                        border: `1px solid ${notifyHour === h ? 'rgba(99,102,241,0.5)' : 'var(--color-border)'}`,
                                        color: notifyHour === h ? '#818cf8' : 'var(--color-text-muted)',
                                    }}
                                >
                                    {formatHour(h)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timezone selector */}
                    <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                            Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={e => setTimezone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                            style={{
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={saveTimePreference}
                        disabled={saving}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                        {saving ? 'Saving…' : 'Save Time Preference'}
                    </button>
                </div>
            )}

            {/* Feedback message */}
            {savedMsg && (
                <p className="text-xs text-center transition-all" style={{ color: '#6ee7b7' }}>
                    {savedMsg}
                </p>
            )}
        </div>
    );
}
