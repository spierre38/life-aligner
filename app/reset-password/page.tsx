'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth';
import Wordmark from '@/app/components/Wordmark';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await requestPasswordReset(email);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to send reset email');
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ───────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="flex justify-center mb-10">
                        <Link href="/" aria-label="Tim Collins Framework — home">
                            <Wordmark size="md" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Check your email</h1>
                        <p className="text-sm text-gray-500 text-center mb-2">We&apos;ve sent a password reset link to:</p>
                        <p className="text-sm font-medium text-gray-900 text-center mb-6">{email}</p>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-600">
                            <p className="font-medium text-gray-900 mb-2">Didn&apos;t receive the email?</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Check your spam/junk folder</li>
                                <li>Make sure you entered the correct email</li>
                                <li>Wait a few minutes for delivery</li>
                            </ul>
                        </div>

                        <p className="text-xs text-gray-400 text-center mb-6">
                            The link expires in 1 hour. We&apos;ll never ask for your password via email.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition"
                            >
                                Return to Sign In
                            </button>
                            <button
                                onClick={() => setSuccess(false)}
                                className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                            >
                                Send another email
                            </button>
                        </div>

                        {/* Support help */}
                        <p className="text-xs text-center text-gray-400 mt-5 pt-4 border-t border-gray-100">
                            Still need help? Email us at{' '}
                            <a href="mailto:support@timcollinsframework.com" className="text-gray-600 hover:text-gray-900 underline transition">
                                support@timcollinsframework.com
                            </a>
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition">← Back to home</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main form ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-10">
                    <Link href="/" aria-label="Tim Collins Framework — home">
                        <Wordmark size="md" />
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
                        <p className="mt-1 text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                                autoComplete="email"
                                autoFocus
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send Reset Link
                                </>
                            )}
                        </button>

                        <p className="text-sm text-center text-gray-500">
                            Remember your password?{' '}
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="font-medium text-gray-900 hover:underline transition"
                            >
                                Sign in
                            </button>
                        </p>

                        {/* Support help */}
                        <p className="text-xs text-center text-gray-400 pt-3 border-t border-gray-100">
                            Need assistance? Contact{' '}
                            <a href="mailto:support@timcollinsframework.com" className="text-gray-600 hover:text-gray-900 underline transition">
                                support@timcollinsframework.com
                            </a>
                        </p>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition">← Back to home</Link>
                </div>
            </div>
        </div>
    );
}
