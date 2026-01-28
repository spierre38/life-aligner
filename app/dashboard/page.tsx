'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserWithProfile, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AuthNavbar } from '@/app/components/AuthNavbar';

type WorkbookProgress = {
    values: boolean;
    interests: boolean;
    lifeCategories: boolean;
    lifeframe: boolean;
    roadmap: boolean;
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<WorkbookProgress>({
        values: false,
        interests: false,
        lifeCategories: false,
        lifeframe: false,
        roadmap: false,
    });

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const result = await getUserWithProfile();

        if (!result) {
            router.push('/login');
            return;
        }

        setUser(result.user);
        await loadProgress(result.user.id);
        setLoading(false);
    };

    const loadProgress = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('workbook_entries')
                .select('category')
                .eq('user_id', userId);

            if (error) throw error;

            const completed = data?.map(entry => entry.category) || [];

            setProgress({
                values: completed.includes('values'),
                interests: completed.includes('interests'),
                lifeCategories: completed.includes('life_categories'),
                lifeframe: completed.includes('values') && completed.includes('interests') && completed.includes('life_categories'),
                roadmap: completed.includes('roadmap'),
            });
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const completedCount = Object.values(progress).filter(Boolean).length;
    const totalSteps = 5;
    const progressPercentage = (completedCount / totalSteps) * 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-800">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                {/* Old header removed - now using AuthNavbar */}
                {/* Header removed - using AuthNavbar instead */}

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">
                            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋
                        </h2>
                        <p className="text-xl text-gray-800">
                            Continue building your path to contentment
                        </p>
                    </div>

                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Your Progress</h3>
                                <p className="text-gray-800 mt-1">
                                    {completedCount} of {totalSteps} steps completed
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {Math.round(progressPercentage)}%
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>

                        {/* Steps Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Step 1: Values */}
                            <Link
                                href="/workbook/values"
                                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${progress.values
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-gray-50 border-gray-200 hover:border-purple-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {progress.values ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-bold">1</span>
                                        </div>
                                    )}
                                    <h4 className="text-lg font-bold text-gray-900">Values</h4>
                                </div>
                                <p className="text-sm text-gray-800">
                                    {progress.values ? 'Completed ✓' : 'Identify your core values'}
                                </p>
                            </Link>


                            {/* Step 2: Interests */}
                            <Link
                                href={progress.values ? "/workbook/interests" : "#"}
                                onClick={(e) => {
                                    if (!progress.values) {
                                        e.preventDefault();
                                        alert('Please complete the Values worksheet first.');
                                    }
                                }}
                                className={`p-6 rounded-xl border-2 transition-all ${progress.values ? 'hover:scale-105' : 'cursor-not-allowed'
                                    } ${progress.interests
                                        ? 'bg-green-50 border-green-500'
                                        : progress.values
                                            ? 'bg-gray-50 border-gray-200 hover:border-purple-500'
                                            : 'bg-gray-100 border-gray-300 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {progress.interests ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : progress.values ? (
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-bold">2</span>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center relative">
                                            <span className="text-gray-500 font-bold">2</span>
                                            <svg className="w-4 h-4 text-gray-500 absolute -top-1 -right-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                    <h4 className="text-lg font-bold text-gray-900">Interests</h4>
                                </div>
                                <p className="text-sm text-gray-800">
                                    {progress.interests
                                        ? 'Completed ✓'
                                        : progress.values
                                            ? 'Identify your passions'
                                            : '🔒 Complete Values first'}
                                </p>
                            </Link>


                            {/* Step 3: Life Categories */}
                            <Link
                                href={progress.interests ? "/workbook/life-categories" : "#"}
                                onClick={(e) => {
                                    if (!progress.interests) {
                                        e.preventDefault();
                                        alert('Please complete the Interests worksheet first.');
                                    }
                                }}
                                className={`p-6 rounded-xl border-2 transition-all ${progress.interests ? 'hover:scale-105' : 'cursor-not-allowed'
                                    } ${progress.lifeCategories
                                        ? 'bg-green-50 border-green-500'
                                        : progress.interests
                                            ? 'bg-gray-50 border-gray-200 hover:border-purple-500'
                                            : 'bg-gray-100 border-gray-300 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {progress.lifeCategories ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : progress.interests ? (
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-bold">3</span>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center relative">
                                            <span className="text-gray-500 font-bold">3</span>
                                            <svg className="w-4 h-4 text-gray-500 absolute -top-1 -right-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                    <h4 className="text-lg font-bold text-gray-900">Life Categories</h4>
                                </div>
                                <p className="text-sm text-gray-800">
                                    {progress.lifeCategories
                                        ? 'Completed ✓'
                                        : progress.interests
                                            ? 'Define your key areas'
                                            : '🔒 Complete Interests first'}
                                </p>
                            </Link>


                            {/* Step 4: LifeFrame */}
                            <div
                                className={`p-6 rounded-xl border-2 ${progress.lifeframe
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-gray-100 border-gray-200 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {progress.lifeframe ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-gray-800 font-bold">4</span>
                                        </div>
                                    )}
                                    <h4 className="text-lg font-bold text-gray-900">LifeFrame</h4>
                                </div>
                                <p className="text-sm text-gray-800">
                                    {progress.lifeframe ? 'Completed ✓' : 'Coming soon'}
                                </p>
                            </div>

                            {/* Step 5: Roadmap */}
                            <div
                                className={`p-6 rounded-xl border-2 ${progress.roadmap
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-gray-100 border-gray-200 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {progress.roadmap ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-gray-800 font-bold">5</span>
                                        </div>
                                    )}
                                    <h4 className="text-lg font-bold text-gray-900">Roadmap</h4>
                                </div>
                                <p className="text-sm text-gray-800">
                                    {progress.roadmap ? 'Completed ✓' : 'Coming soon'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">
                            {completedCount === 0 ? 'Ready to begin?' : 'Keep going!'}
                        </h3>
                        <p className="text-blue-100 mb-6">
                            {completedCount === 0
                                ? 'Start with the Values worksheet to build your foundation'
                                : 'Continue your journey to contentment'}
                        </p>
                        <Link
                            href="/workbook/values"
                            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105"
                        >
                            {completedCount === 0 ? 'Start Your LifeFrame' : 'Continue'}
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
