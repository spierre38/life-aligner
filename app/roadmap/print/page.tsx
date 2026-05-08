'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';

type RoadmapEntry = {
    life_category: string;
    goals: Array<{
        goal: string;
        type: 'goal' | 'behavior_change';
        activities: string[];
    }>;
};

export default function RoadmapPrintView() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [roadmapData, setRoadmapData] = useState<RoadmapEntry[]>([]);
    const [currentDate, setCurrentDate] = useState('');
    const [lifeFrameComplete, setLifeFrameComplete] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUserName(userWithProfile.profile.full_name || 'Your Roadmap');
                setCurrentDate(new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }));

                // Check if LifeFrame is complete (prerequisite for Roadmap)
                const { data: entries, error: entriesError } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (entriesError) throw entriesError;

                const hasValues = entries?.some(e => e.category === 'values');
                const hasInterests = entries?.some(e => e.category === 'interests');
                const hasCategories = entries?.some(e => e.category === 'life_categories');

                if (!hasValues || !hasInterests || !hasCategories) {
                    setLifeFrameComplete(false);
                    setLoading(false);
                    return;
                }

                setLifeFrameComplete(true);

                // Fetch Roadmap data
                const { data: roadmapEntries, error: roadmapError } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'roadmap')
                    .single();

                if (roadmapError && roadmapError.code !== 'PGRST116') {
                    throw roadmapError;
                }

                if (roadmapEntries?.content) {
                    // Roadmap data is stored as { items: [...] } where each item has a category property
                    // Transform to group by category for print view
                    const items = roadmapEntries.content.items || [];

                    // Group items by category
                    const groupedByCategory: { [key: string]: RoadmapEntry } = {};

                    items.forEach((item: any) => {
                        if (!groupedByCategory[item.category]) {
                            groupedByCategory[item.category] = {
                                life_category: item.category,
                                goals: []
                            };
                        }

                        groupedByCategory[item.category].goals.push({
                            goal: item.title,
                            type: item.type,
                            activities: item.activities.map((a: any) => a.text)
                        });
                    });

                    setRoadmapData(Object.values(groupedByCategory));
                }

            } catch (error) {
                console.error('Error loading Roadmap data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Auto-trigger print dialog after page loads (optional)
    useEffect(() => {
        if (!loading && lifeFrameComplete && roadmapData.length > 0) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, lifeFrameComplete, roadmapData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your Roadmap...</p>
                </div>
            </div>
        );
    }

    // Show message if LifeFrame not complete
    if (!lifeFrameComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">LifeFrame Required</h2>
                    <p className="text-gray-700 mb-6">
                        You need to complete your LifeFrame (Values, Interests, and Life Categories) before you can view or print your Roadmap.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Show message if Roadmap is empty
    if (roadmapData.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Roadmap Empty</h2>
                    <p className="text-gray-700 mb-6">
                        You haven't created any goals yet. Complete the Roadmap worksheet to add goals and activities.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Print Button - Hidden when printing */}
            <div className="no-print sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save as PDF
                </button>
            </div>

            {/* Printable Content */}
            <div className="max-w-4xl mx-auto p-8 print:p-0 bg-white">
                {/* Header */}
                <div className="mb-12 text-center print:mb-8">
                    <div className="text-sm text-gray-500 mb-2">Tim Collins Framework</div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-3xl">YOUR ROADMAP</h1>
                    <div className="text-lg text-gray-700">{userName}</div>
                    <div className="text-sm text-gray-500">{currentDate}</div>
                </div>

                <div className="border-t-2 border-gray-300 mb-8"></div>

                {/* Roadmap Sections */}
                <div className="space-y-10">
                    {roadmapData.map((entry, entryIndex) => (
                        <section key={entryIndex} className="page-break-inside-avoid print:mb-8">
                            {/* Life Category Header */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-indigo-600 uppercase tracking-wide print:text-xl">
                                    {entry.life_category}
                                </h2>
                                <div className="h-1 w-20 bg-indigo-600 mt-2"></div>
                            </div>

                            {/* Goals */}
                            <div className="space-y-6">
                                {entry.goals.map((goalItem, goalIndex) => (
                                    <div key={goalIndex} className="pl-4">
                                        {/* Goal/Behavior Change */}
                                        <div className="mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center mt-1">
                                                    <span className="text-white text-xs font-bold">
                                                        {goalItem.type === 'goal' ? 'G' : 'B'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-indigo-600 uppercase">
                                                        {goalItem.type === 'goal' ? 'Goal' : 'Behavior Change'}
                                                    </span>
                                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                                        {goalItem.goal}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activities */}
                                        {goalItem.activities && goalItem.activities.length > 0 && (
                                            <div className="ml-9 space-y-2">
                                                <p className="text-sm font-semibold text-gray-700">Activities:</p>
                                                <ul className="space-y-2">
                                                    {goalItem.activities.map((activity, actIndex) => (
                                                        <li key={actIndex} className="flex items-start gap-3">
                                                            <span className="text-indigo-400 mt-1">•</span>
                                                            <span className="text-gray-700">{activity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Divider between categories */}
                            {entryIndex < roadmapData.length - 1 && (
                                <div className="border-t border-gray-200 mt-8"></div>
                            )}
                        </section>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-6 mt-12 text-center text-sm text-gray-500 print:mt-8">
                    <p>Tim Collins Framework • Your path to contentment</p>
                    <p className="mt-1">Visit lifealigner.com to update your Roadmap</p>
                </div>
            </div>

            {/* Print-specific styles */}
            <style jsx global>{`
        @media print {
          /* Hide elements */
          .no-print {
            display: none !important;
          }

          /* Remove margins for print */
          @page {
            margin: 0.5in;
          }

          /* Ensure clean page breaks */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Full width for print */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Adjust font sizes for print */
          h1 {
            font-size: 28pt !important;
          }
          h2 {
            font-size: 18pt !important;
          }
          h3 {
            font-size: 14pt !important;
          }
          p, li, span {
            font-size: 11pt !important;
          }
        }
      `}</style>
        </>
    );
}
