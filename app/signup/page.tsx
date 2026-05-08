'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackSignup } from '@/lib/analytics';
import Wordmark from '@/app/components/Wordmark';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailPending, setEmailPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.fullName.trim()) { setError('Please enter your full name'); return; }
        if (!formData.email.trim()) { setError('Please enter your email'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { full_name: formData.fullName },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (authError) {
                setError(
                    authError.message.includes('already registered') || authError.message.includes('already been registered')
                        ? 'This email is already registered. Please sign in or use a different email.'
                        : authError.message
                );
                setLoading(false);
                return;
            }

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                setError('This email is already registered. Please sign in instead.');
                setLoading(false);
                return;
            }

            if (authData.user && !authData.user.confirmed_at) {
                trackSignup('email');
                setUserEmail(formData.email);
                setEmailPending(true);
                setLoading(false);
            } else if (authData.user && authData.user.confirmed_at) {
                trackSignup('email');
                router.push('/dashboard');
            } else {
                setError('Failed to create account');
                setLoading(false);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Signup error:', err);
            setLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        setError('');
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({ type: 'signup', email: userEmail });
            if (error) setError('Failed to resend confirmation email');
        } catch (err) {
            setError('Failed to resend confirmation email');
            console.error('Resend error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Email pending screen ─────────────────────────────────────────────────
    if (emailPending) {
        return (
            <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Wordmark */}
                    <div className="flex justify-center mb-10">
                        <Link href="/" aria-label="Tim Collins Framework — home">
                            <Wordmark size="md" />
                        </Link>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Check your email</h1>
                        <p className="text-sm text-gray-500 text-center mb-2">We sent a confirmation link to:</p>
                        <p className="text-sm font-medium text-gray-900 text-center mb-6">{userEmail}</p>

                        {/* Instructions */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900 mb-2">Next steps</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Check your inbox (and spam folder)</li>
                                <li>Click the confirmation link</li>
                                <li>Return here and sign in</li>
                            </ol>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleResendConfirmation}
                            disabled={loading}
                            className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
                        >
                            {loading ? 'Sending…' : 'Resend confirmation email'}
                        </button>

                        <p className="text-sm text-center text-gray-500">
                            Already confirmed?{' '}
                            <Link href="/login" className="font-medium text-gray-900 hover:underline transition">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main signup form ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Wordmark */}
                <div className="flex justify-center mb-10">
                    <Link href="/" aria-label="Tim Collins Framework — home">
                        <Wordmark size="md" />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                        <p className="mt-1 text-sm text-gray-500">Start your journey to contentment</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <input
                                id="fullName" name="fullName" type="text" required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input
                                id="email" name="email" type="email" autoComplete="email" required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="password" name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                                    placeholder="At least 6 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="confirmPassword" name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password" required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                                    placeholder="Re-enter your password"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account…
                                </span>
                            ) : 'Create Account'}
                        </button>

                        <p className="text-sm text-center text-gray-500">
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium text-gray-900 hover:underline transition">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
