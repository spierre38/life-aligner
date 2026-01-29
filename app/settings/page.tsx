'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUser(userWithProfile.user);
                setFormData({
                    fullName: userWithProfile.user.user_metadata?.full_name || '',
                    email: userWithProfile.user.email || '',
                });
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [router]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.fullName
                }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-800">Loading settings...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-6">
                            ⚙️
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">Settings</h1>
                        <p className="text-xl text-gray-800">
                            Manage your account and preferences
                        </p>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                            <p className={`font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    {/* Profile Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <span className="text-3xl">👤</span>
                            Profile Information
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none text-gray-900 transition"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-sm text-gray-600 mt-2">
                                    Email cannot be changed. Contact support if you need to update it.
                                </p>
                            </div>

                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <span className="text-3xl">🔐</span>
                            Account Actions
                        </h2>

                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full flex items-center justify-between px-6 py-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📊</span>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-900">Go to Dashboard</div>
                                        <div className="text-sm text-gray-800">View your progress</div>
                                    </div>
                                </div>
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-between px-6 py-4 border-2 border-red-200 rounded-xl hover:bg-red-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🚪</span>
                                    <div className="text-left">
                                        <div className="font-bold text-red-600">Sign Out</div>
                                        <div className="text-sm text-red-700">Log out of your account</div>
                                    </div>
                                </div>
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Coming Soon Features */}
                    <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🚀</span>
                            Coming Soon
                        </h3>
                        <ul className="space-y-2 text-gray-800">
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-600">•</span>
                                Password change
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-600">•</span>
                                Notification preferences
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-600">•</span>
                                Data export & backup
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-600">•</span>
                                Account deletion
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
