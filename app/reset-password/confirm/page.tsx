'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword, checkPasswordStrength } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordConfirmPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validToken, setValidToken] = useState(false);
    const [checkingToken, setCheckingToken] = useState(true);

    // Password strength indicator
    const strength = checkPasswordStrength(newPassword);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setValidToken(true);
                setCheckingToken(false);
            } else if (event === 'SIGNED_IN' && session) {
                setValidToken(true);
                setCheckingToken(false);
            }
        });

        const checkExisting = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setValidToken(true);
                setCheckingToken(false);
            }
        };

        const timeout = setTimeout(() => {
            checkExisting().then(() => {
                setTimeout(() => {
                    setCheckingToken(prev => {
                        if (prev) {
                            setError('Invalid or expired reset link. Please request a new one.');
                            return false;
                        }
                        return prev;
                    });
                }, 3000);
            });
        }, 500);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        if (newPassword.length < 8) { setError('Password must be at least 8 characters long'); return; }
        if (strength.score < 2) { setError('Please choose a stronger password'); return; }

        setLoading(true);
        try {
            const result = await updatePassword(newPassword);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setError(result.error || 'Failed to update password');
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle: React.CSSProperties = {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
    };

    const pageStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        padding: '24px 16px',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 48px 12px 14px',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        fontSize: 14,
        color: '#111',
        background: '#f9fafb',
        outline: 'none',
        transition: 'border-color 0.15s',
        fontFamily: 'system-ui, sans-serif',
    };

    if (checkingToken) {
        return (
            <div style={pageStyle}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>Verifying reset link…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!validToken) {
        return (
            <div style={pageStyle}>
                <div style={{ maxWidth: 420, width: '100%' }}>
                    <div style={cardStyle}>
                        <div style={{ width: 56, height: 56, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#ef4444' }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>Invalid Reset Link</h1>
                        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
                            {error || 'This password reset link is invalid or has expired.'}
                        </p>
                        <button
                            onClick={() => router.push('/reset-password')}
                            style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}
                        >
                            Request New Reset Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={pageStyle}>
                <div style={{ maxWidth: 420, width: '100%' }}>
                    <div style={cardStyle}>
                        <div style={{ width: 56, height: 56, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#16a34a' }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>Password Updated</h1>
                        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
                            Your password has been updated. You can now sign in.
                        </p>
                        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#9ca3af', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                            Redirecting in 3 seconds…
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}
                        >
                            Go to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const strengthColors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                {/* Wordmark */}
                <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui, sans-serif' }}>
                    Tim Collins Framework
                </p>

                <div style={cardStyle}>
                    <div style={{ width: 48, height: 48, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#374151' }}>
                        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#111', textAlign: 'center', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                        Set New Password
                    </h1>
                    <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                        Choose a strong password to secure your account.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* New Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                    style={inputStyle}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Strength bar */}
                            {newPassword && (
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strengthColors[strength.score] : '#e5e7eb', transition: 'background 0.2s' }} />
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: strengthColors[strength.score], fontFamily: 'system-ui, sans-serif' }}>
                                        {strengthLabels[strength.score]} · {strength.feedback}
                                    </p>
                                </div>
                            )}

                            {/* Requirements */}
                            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                    { met: newPassword.length >= 8, label: 'At least 8 characters' },
                                    { met: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword), label: 'Upper and lowercase letters' },
                                    { met: /\d/.test(newPassword), label: 'At least one number' },
                                    { met: /[^a-zA-Z0-9]/.test(newPassword), label: 'Special character (recommended)' },
                                ].map(({ met, label }) => (
                                    <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: met ? '#16a34a' : '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                            {met
                                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                : <circle cx="12" cy="12" r="2" fill="currentColor" />
                                            }
                                        </svg>
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                                disabled={loading}
                                autoComplete="new-password"
                                style={inputStyle}
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444', fontFamily: 'system-ui, sans-serif' }}>Passwords do not match</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && (
                                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#16a34a', fontFamily: 'system-ui, sans-serif' }}>Passwords match</p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p style={{ margin: 0, fontSize: 13, color: '#dc2626', fontFamily: 'system-ui, sans-serif' }}>{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || strength.score < 2}
                            style={{ width: '100%', padding: '13px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || strength.score < 2) ? 0.5 : 1, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'system-ui, sans-serif' }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    Updating Password…
                                </>
                            ) : 'Set New Password'}
                        </button>
                    </form>
                </div>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui, sans-serif' }}>
                    Your password is encrypted and stored securely.
                </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
