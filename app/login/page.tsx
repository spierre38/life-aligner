'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';

// Separate component for search params logic
function LoginFormWithParams() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Check for URL parameters (verification success/error)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'verification_failed') {
            setError('Email verification failed. Please try signing up again or contact support.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!formData.password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            const result = await signIn(formData.email, formData.password);

            if (result.success) {
                router.push('/dashboard');
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="you@example.com"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-800">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500 transition">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            LifeAligner
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-gray-800">
                        Sign in to continue your journey
                    </p>
                </div>

                {/* Login Form wrapped in Suspense */}
                <Suspense fallback={
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="animate-pulse space-y-6">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-12 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                }>
                    <LoginFormWithParams />
                </Suspense>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-800 hover:text-gray-900 transition">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}