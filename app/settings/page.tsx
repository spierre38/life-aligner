'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar } from '@/lib/avatar';
import AuthNavbar from '@/app/components/AuthNavbar';

const NotificationSettings = dynamic(() => import('@/app/components/NotificationSettings'), { ssr: false });

export default function SettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({ fullName: '', email: '' });

    useEffect(() => {
        const load = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) { router.push('/login'); return; }
                setUser(userWithProfile.user);
                setFormData({
                    fullName: userWithProfile.profile?.full_name || userWithProfile.user.user_metadata?.full_name || '',
                    email: userWithProfile.user.email || '',
                });
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', userWithProfile.user.id)
                    .single();
                if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
            } catch (err) {
                console.error('Settings load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [router]);

    // ── Avatar handlers ──────────────────────────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be under 10MB.' });
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        setUploadingAvatar(true);
        setMessage(null);

        const { url, error } = await uploadAvatar(file);
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(null);

        if (error) {
            setMessage({ type: 'error', text: `Upload failed: ${error}` });
        } else if (url) {
            setAvatarUrl(url);
            setMessage({ type: 'success', text: 'Profile photo updated!' });
        }
        setUploadingAvatar(false);
        e.target.value = '';
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Remove your profile photo?')) return;
        setUploadingAvatar(true);
        const { error } = await removeAvatar();
        if (error) {
            setMessage({ type: 'error', text: `Failed to remove: ${error}` });
        } else {
            setAvatarUrl(null);
            setMessage({ type: 'success', text: 'Profile photo removed.' });
        }
        setUploadingAvatar(false);
    };

    // ── Profile name handler ─────────────────────────────────────────────────

    const handleUpdateProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { error: authErr } = await supabase.auth.updateUser({
                data: { full_name: formData.fullName },
            });
            if (authErr) throw authErr;
            await supabase.from('profiles').update({ full_name: formData.fullName }).eq('id', user.id);
            setMessage({ type: 'success', text: 'Profile updated!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // ── Derived ──────────────────────────────────────────────────────────────

    const displayAvatar = previewUrl || avatarUrl;
    const initials = (formData.fullName || formData.email || 'U')[0].toUpperCase();

    if (loading) return (
        <>
            <AuthNavbar />
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64 }}>
                <div style={{ width: 40, height: 40, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-text)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </>
    );

    return (
        <>
            <AuthNavbar />
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 64 }}>
                <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                            Account Settings
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
                            Manage your profile and preferences
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div style={{
                            marginBottom: 20,
                            padding: '12px 16px',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            ...(message.type === 'success'
                                ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#16a34a' }
                                : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' })
                        }}>
                            {message.type === 'success' ? (
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            )}
                            {message.text}
                        </div>
                    )}

                    {/* ── Profile Photo ───────────────────────────────────── */}
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                            Profile Photo
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            {/* Avatar */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-border)' }}>
                                    {displayAvatar ? (
                                        <Image
                                            src={displayAvatar}
                                            alt="Profile photo"
                                            width={80}
                                            height={80}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploadingAvatar ? 0.5 : 1 }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--color-text)' }}>
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                {uploadingAvatar && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(0,0,0,0.4)' }}>
                                        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    JPG, PNG or GIF · Max 10MB
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        style={{ padding: '9px 18px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: uploadingAvatar ? 0.5 : 1 }}
                                    >
                                        {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    {avatarUrl && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            disabled={uploadingAvatar}
                                            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: uploadingAvatar ? 0.5 : 1 }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Info ────────────────────────────────────── */}
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                            Profile Information
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    style={{
                                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        borderRadius: 10, fontSize: 14, color: 'var(--color-text)', outline: 'none',
                                        transition: 'border-color 0.15s'
                                    }}
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    style={{
                                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        borderRadius: 10, fontSize: 14, color: 'var(--color-text-dim)',
                                        cursor: 'not-allowed', opacity: 0.6
                                    }}
                                />
                                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-dim)' }}>
                                    Email cannot be changed — contact support if needed.
                                </p>
                            </div>
                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                style={{
                                    width: '100%', padding: '12px', background: 'var(--color-text)', color: 'var(--color-bg)',
                                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'opacity 0.15s'
                                }}
                            >
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* ── Account Actions ─────────────────────────────────── */}
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                            Account
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Dashboard */}
                            <button
                                onClick={() => router.push('/dashboard')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 34, height: 34, background: 'var(--color-surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Dashboard</span>
                                </div>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-dim)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 34, height: 34, background: 'rgba(239,68,68,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Sign Out</span>
                                </div>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(239,68,68,0.4)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* ── Notifications ──────────────────────────────────── */}
                    <div style={{ marginBottom: 12 }}>
                        <NotificationSettings />
                    </div>

                    {/* Coming Soon */}
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 20 }}>
                        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                            Coming Soon
                        </p>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['Password change', 'Data export & backup', 'Account deletion'].map(f => (
                                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-dim)', flexShrink: 0 }} />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </>
    );
}
