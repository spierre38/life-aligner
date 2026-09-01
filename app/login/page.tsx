'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { trackLogin } from '@/lib/analytics';
import Wordmark from '@/app/components/Wordmark';

// Separate component for search params logic
function LoginFormWithParams() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Check for URL parameters (verification success/error)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        const verifiedParam = searchParams.get('verified');
        if (errorParam === 'verification_failed') {
            setError('Email verification failed. Please try signing up again or contact support.');
        }
        if (verifiedParam === 'true') {
            setSuccessMsg('Email verified! Sign in to continue your journey.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!formData.email.trim()) { setError('Please enter your email'); return; }
        if (!formData.password) { setError('Please enter your password'); return; }

        setLoading(true);

        try {
            const result = await signIn(formData.email, formData.password);
            if (result.success) {
                trackLogin('email');
                router.push(result.profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard');
            } else {
                setError(result.error?.message || 'Failed to sign in');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                    placeholder="you@example.com"
                />
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
                        placeholder="Enter your password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                    >
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

            {/* Forgot Password */}
            <div className="text-right">
                <Link href="/reset-password" className="text-sm text-gray-500 hover:text-gray-900 transition">
                    Forgot your password?
                </Link>
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
                        Signing in…
                    </span>
                ) : 'Sign In'}
            </button>

            {/* Sign Up Link */}
            <p className="text-sm text-center text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-gray-900 hover:underline transition">
                    Sign up
                </Link>
            </p>

            {/* Support help */}
            <p className="text-xs text-center text-gray-400 pt-3 border-t border-gray-100">
                Need help? Contact{' '}
                <a href="mailto:support@timcollinsframework.com" className="text-gray-600 hover:text-gray-900 underline transition">
                    support@timcollinsframework.com
                </a>
            </p>
        </form>
    );
}

export default function LoginPage() {
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
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                        <p className="mt-1 text-sm text-gray-500">Sign in to continue your journey</p>
                    </div>

                    <Suspense fallback={
                        <div className="animate-pulse space-y-5">
                            <div className="h-11 bg-gray-100 rounded-xl" />
                            <div className="h-11 bg-gray-100 rounded-xl" />
                            <div className="h-11 bg-gray-200 rounded-xl" />
                        </div>
                    }>
                        <LoginFormWithParams />
                    </Suspense>
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