'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';

type LifeFrameData = {
    values?: {
        selected_values: Array<{ name: string; priority: number }>;
    };
    interests?: {
        existing: string[];
        exploring: string[];
    };
    life_categories?: {
        categories: Array<{
            name: string;
            sub_categories?: string[];
        }>;
        purpose_elements?: Array<{ name: string; description?: string }>;
    };
};

export default function LifeFramePrintView() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [lifeFrameData, setLifeFrameData] = useState<LifeFrameData>({});
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUserName(userWithProfile.profile.full_name || 'Your LifeFrame');
                setCurrentDate(new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }));

                // Fetch all workbook entries
                const { data: entries, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (error) throw error;

                // Organize data
                const organized: LifeFrameData = {};
                entries?.forEach(entry => {
                    if (entry.category === 'values') {
                        organized.values = entry.content;
                    } else if (entry.category === 'interests') {
                        organized.interests = entry.content;
                    } else if (entry.category === 'life_categories') {
                        organized.life_categories = entry.content;
                    }
                });

                setLifeFrameData(organized);
            } catch (error) {
                console.error('Error loading LifeFrame data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Auto-trigger print dialog after page loads (optional - can remove if you prefer manual)
    useEffect(() => {
        if (!loading) {
            // Small delay to ensure page is fully rendered
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your LifeFrame...</p>
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
                    <div className="text-sm text-gray-500 mb-2">LifeAligner</div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-3xl">YOUR LIFEFRAME</h1>
                    <div className="text-lg text-gray-700">{userName}</div>
                    <div className="text-sm text-gray-500">{currentDate}</div>
                </div>

                <div className="border-t-2 border-gray-300 mb-8"></div>

                {/* Values Section */}
                <section className="mb-12 page-break-inside-avoid print:mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 print:text-xl">YOUR VALUES</h2>
                        {lifeFrameData.values && (
                            <div className="flex items-center gap-2 text-green-600 no-print">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>

                    {lifeFrameData.values ? (
                        <div className="space-y-3">
                            {lifeFrameData.values.selected_values
                                ?.sort((a, b) => a.priority - b.priority)
                                .map((value, index) => (
                                    <div key={index} className="flex items-start gap-3 pl-4">
                                        <span className="font-bold text-indigo-600 flex-shrink-0">{value.priority}.</span>
                                        <span className="text-gray-800">{value.name}</span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 italic">Not yet completed</p>
                            <p className="text-sm text-gray-400 mt-2">Complete the Values worksheet to see your values here</p>
                        </div>
                    )}
                </section>

                <div className="border-t border-gray-200 mb-8"></div>

                {/* Interests Section */}
                <section className="mb-12 page-break-inside-avoid print:mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 print:text-xl">YOUR INTERESTS</h2>
                        {lifeFrameData.interests && (
                            <div className="flex items-center gap-2 text-green-600 no-print">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>

                    {lifeFrameData.interests ? (
                        <div className="space-y-6">
                            {/* Existing Interests */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">✓</span>
                                    Existing Interests
                                </h3>
                                <div className="pl-4">
                                    <p className="text-gray-700">
                                        {lifeFrameData.interests.existing?.join(', ') || 'None selected'}
                                    </p>
                                </div>
                            </div>

                            {/* Exploring Interests */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">⭐</span>
                                    Interests to Explore
                                </h3>
                                <div className="pl-4">
                                    <p className="text-gray-700">
                                        {lifeFrameData.interests.exploring?.join(', ') || 'None selected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 italic">Not yet completed</p>
                            <p className="text-sm text-gray-400 mt-2">Complete the Interests worksheet to see your interests here</p>
                        </div>
                    )}
                </section>

                <div className="border-t border-gray-200 mb-8"></div>

                {/* Life Categories Section */}
                <section className="mb-12 page-break-inside-avoid print:mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 print:text-xl">YOUR LIFE CATEGORIES</h2>
                        {lifeFrameData.life_categories && (
                            <div className="flex items-center gap-2 text-green-600 no-print">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>

                    {lifeFrameData.life_categories ? (
                        <div className="space-y-4">
                            {lifeFrameData.life_categories.categories?.map((category, index) => (
                                <div key={index} className="pl-4">
                                    <div className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold mt-1">•</span>
                                        <div>
                                            <span className="font-semibold text-gray-900">{category.name}</span>
                                            {category.sub_categories && category.sub_categories.length > 0 && (
                                                <div className="mt-2 ml-4 space-y-1">
                                                    {category.sub_categories.map((sub, subIndex) => (
                                                        <div key={subIndex} className="flex items-start gap-2 text-gray-700">
                                                            <span className="text-gray-400">-</span>
                                                            <span>{sub}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Purpose Elements */}
                            {lifeFrameData.life_categories.purpose_elements &&
                                lifeFrameData.life_categories.purpose_elements.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Purpose</h3>
                                        <div className="space-y-2">
                                            {lifeFrameData.life_categories.purpose_elements.map((element, index) => (
                                                <div key={index} className="flex items-start gap-2 pl-4">
                                                    <span className="text-indigo-600 font-bold mt-1">•</span>
                                                    <div className="text-gray-700">
                                                        <div className="font-semibold">{typeof element === 'string' ? element : element.name}</div>
                                                        {typeof element === 'object' && element.description && (
                                                            <div className="text-sm text-gray-600 mt-1">{element.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 italic">Not yet completed</p>
                            <p className="text-sm text-gray-400 mt-2">Complete the Life Categories worksheet to see your categories here</p>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-6 mt-12 text-center text-sm text-gray-500 print:mt-8">
                    <p>LifeAligner • Your path to contentment</p>
                    <p className="mt-1">Visit lifealigner.com to update your LifeFrame</p>
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
