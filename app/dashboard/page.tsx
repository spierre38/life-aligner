'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import WelcomeAnimation from '@/app/components/WelcomeAnimation';

type WorksheetStatus = {
    values: boolean;
    interests: boolean;
    life_categories: boolean;
};

type RoadmapStats = {
    activeGoals: number;
    completedGoals: number;
    weeklyProgress: number;
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [status, setStatus] = useState<WorksheetStatus>({
        values: false,
        interests: false,
        life_categories: false
    });
    const [hasRoadmap, setHasRoadmap] = useState(false);
    const [roadmapStats, setRoadmapStats] = useState<RoadmapStats>({
        activeGoals: 0,
        completedGoals: 0,
        weeklyProgress: 0
    });

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUser(userWithProfile);

                // Check if this is first time seeing welcome
                if (!userWithProfile.profile?.welcome_seen) {
                    setShowWelcome(true);
                }

                // Check completion status
                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id);

                const completed = {
                    values: worksheets?.some(w => w.category === 'values') || false,
                    interests: worksheets?.some(w => w.category === 'interests') || false,
                    life_categories: worksheets?.some(w => w.category === 'life_categories') || false
                };

                setStatus(completed);

                // Load roadmap data and calculate stats
                const roadmapEntry = worksheets?.find(w => w.category === 'roadmap');
                if (roadmapEntry && roadmapEntry.content?.goals) {
                    setHasRoadmap(true);
                    const goals = roadmapEntry.content.goals;

                    // Calculate stats
                    const active = goals.filter((g: any) => !g.completed).length;
                    const completed = goals.filter((g: any) => g.completed).length;

                    // Calculate weekly progress based on habits
                    let habitsCompleted = 0;
                    let totalHabits = 0;
                    goals.forEach((goal: any) => {
                        goal.activities?.forEach((activity: any) => {
                            if (activity.is_habit && activity.habit_days) {
                                totalHabits += 7;
                                habitsCompleted += activity.habit_days.filter(Boolean).length;
                            }
                        });
                    });

                    const weeklyProgress = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

                    setRoadmapStats({
                        activeGoals: active,
                        completedGoals: completed,
                        weeklyProgress
                    });
                } else {
                    setHasRoadmap(false);
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [router]);

    const worksheetsComplete = Object.values(status).filter(Boolean).length;
    const lifeFrameComplete = status.values && status.interests && status.life_categories;
    const progressPercentage = (worksheetsComplete / 3) * 100;

    const worksheetSteps = [
        {
            id: 'values',
            number: 1,
            title: 'Values',
            description: 'Define your core principles',
            icon: '📌',
            path: '/workbook/values',
            locked: false,
            completed: status.values,
            gradient: 'from-blue-600 to-purple-600'
        },
        {
            id: 'interests',
            number: 2,
            title: 'Interests',
            description: 'Discover what brings you joy',
            icon: '❤️',
            path: '/workbook/interests',
            locked: !status.values,
            completed: status.interests,
            gradient: 'from-pink-600 to-orange-600'
        },
        {
            id: 'life_categories',
            number: 3,
            title: 'Life Categories',
            description: 'Set your focus areas & purpose',
            icon: '🎯',
            path: '/workbook/life-categories',
            locked: !status.interests,
            completed: status.life_categories,
            gradient: 'from-indigo-600 to-purple-600'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Show welcome animation on first login
    if (showWelcome) {
        return (
            <WelcomeAnimation
                onComplete={() => setShowWelcome(false)}
                userName={user?.profile?.full_name}
            />
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            Welcome back, {user?.profile?.full_name || 'Friend'}! 👋
                        </h1>
                        <p className="text-xl text-gray-600">
                            {lifeFrameComplete
                                ? "Your LifeFrame is complete! Time to build your Roadmap."
                                : "Continue building your LifeFrame"
                            }
                        </p>
                    </div>

                    {/* LifeFrame Progress */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">LifeFrame Progress</h2>
                                <p className="text-gray-600">
                                    Complete all 3 worksheets to build your foundation
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {worksheetsComplete}/3
                                </div>
                                <div className="text-sm text-gray-500">Worksheets</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                                <span className="text-sm font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Journey Steps */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {worksheetSteps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`
                    relative rounded-2xl p-6 transition-all
                    ${step.completed
                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                                            : step.locked
                                                ? 'bg-gray-50 border-2 border-gray-200 opacity-60'
                                                : 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-indigo-200 hover:shadow-xl hover:scale-105'
                                        }
                  `}
                                >
                                    {/* Step Number Badge */}
                                    <div className={`
                    absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg
                    ${step.completed
                                            ? 'bg-green-500'
                                            : step.locked
                                                ? 'bg-gray-400'
                                                : `bg-gradient-to-br ${step.gradient}`
                                        }
                  `}>
                                        {step.completed ? '✓' : step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="text-5xl mb-4 text-center">
                                        {step.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="text-center mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Button */}
                                    {step.completed ? (
                                        <button
                                            onClick={() => router.push(step.path)}
                                            className="w-full py-3 bg-white border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition"
                                        >
                                            Review
                                        </button>
                                    ) : step.locked ? (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                                        >
                                            🔒 Locked
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => router.push(step.path)}
                                            className={`w-full py-3 bg-gradient-to-r ${step.gradient} text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105`}
                                        >
                                            {worksheetsComplete === 0 ? 'Start' : 'Continue'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* LifeFrame Complete Badge */}
                        {lifeFrameComplete && (
                            <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <h3 className="text-2xl font-bold mb-2">LifeFrame Complete!</h3>
                                <p className="text-green-100 mb-4">
                                    You've defined your Values, Interests, and Life Categories
                                </p>
                                <button
                                    onClick={() => router.push('/workbook/lifeframe')}
                                    className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                                >
                                    View Your LifeFrame →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Roadmap Section */}
                    {lifeFrameComplete && (
                        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl">
                                    🗺️
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Your Roadmap</h2>
                                    <p className="text-gray-600">
                                        {hasRoadmap
                                            ? "Track your goals and habits"
                                            : "Build your action plan and track progress"
                                        }
                                    </p>
                                </div>
                            </div>

                            {hasRoadmap ? (
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold text-indigo-600 mb-2">{roadmapStats.activeGoals}</div>
                                        <div className="text-sm text-gray-600">Active Goals</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold text-green-600 mb-2">{roadmapStats.completedGoals}</div>
                                        <div className="text-sm text-gray-600">Completed</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold text-purple-600 mb-2">{roadmapStats.weeklyProgress}%</div>
                                        <div className="text-sm text-gray-600">This Week</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                                    <div className="text-6xl mb-4">🗺️</div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        Ready to Build Your Roadmap?
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                                        Now that you've completed your LifeFrame, it's time to create your Roadmap with
                                        goals and activities aligned with your values and purpose.
                                    </p>
                                    <button
                                        onClick={() => router.push('/roadmap')}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                                    >
                                        Create Your Roadmap →
                                    </button>
                                </div>
                            )}

                            {hasRoadmap && (
                                <button
                                    onClick={() => router.push('/roadmap')}
                                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all"
                                >
                                    Open Roadmap →
                                </button>
                            )}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                    📚
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Resources</h3>
                                    <p className="text-sm text-gray-600">Videos, downloads & support</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/resources')}
                                className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-100 transition"
                            >
                                Browse Resources →
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                    💡
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Get Help</h3>
                                    <p className="text-sm text-gray-600">Contact support or join community</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/resources')}
                                className="w-full bg-pink-50 text-pink-600 py-3 rounded-xl font-semibold hover:bg-pink-100 transition"
                            >
                                Get Support →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
