'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar } from '@/lib/avatar';
import AuthNavbar from '@/app/components/AuthNavbar';

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
                // Load avatar from profile
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

        // Validate
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be under 10MB.' });
            return;
        }

        // Show local preview immediately
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
        // Reset file input so the same file can be re-selected
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </>
    );

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 pt-16">
                <div className="max-w-2xl mx-auto px-4 py-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-500 mt-1 text-sm">Manage your profile and preferences</p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold ${
                            message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                            {message.type === 'success' ? '✓' : '⚠'} {message.text}
                        </div>
                    )}

                    {/* ── Profile Photo ───────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
                        <h2 className="text-base font-bold text-gray-900 mb-5">Profile Photo</h2>

                        <div className="flex items-center gap-6">
                            {/* Avatar display */}
                            <div className="relative flex-shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                                    {displayAvatar ? (
                                        <Image
                                            src={displayAvatar}
                                            alt="Profile photo"
                                            width={96}
                                            height={96}
                                            className={`w-full h-full object-cover ${uploadingAvatar ? 'opacity-50' : ''}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-3">
                                    JPG, PNG, or GIF · Max 10MB<br/>
                                    <span className="text-gray-400">Automatically cropped to a square and compressed</span>
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                    >
                                        {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    {avatarUrl && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            disabled={uploadingAvatar}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Info ────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
                        <h2 className="text-base font-bold text-gray-900 mb-5">Profile Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-gray-900 transition"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed — contact support if needed.</p>
                            </div>
                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* ── Account Actions ─────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Account</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">📊</span>
                                    <span className="text-sm font-semibold text-gray-900">Dashboard</span>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-between px-4 py-3 border border-red-100 rounded-xl hover:bg-red-50 transition text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">🚪</span>
                                    <span className="text-sm font-semibold text-red-600">Sign Out</span>
                                </div>
                                <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Coming Soon */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Coming Soon</p>
                        <ul className="space-y-1 text-sm text-amber-800">
                            {['Password change', 'Notification preferences', 'Data export & backup', 'Account deletion'].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-amber-400">•</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </>
    );
}
