'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import ConstellationMap from './ConstellationMap';

type SelectedValue = {
    name: string;
    description: string;
    priority: number;
};

type InterestData = {
    existing: string[];
    exploring: string[];
};

type CategoryDetail = {
    name: string;
    subCategories: string[];
};

type PurposeElement = {
    name: string;
    description: string;
};

type LifeCategoriesData = {
    categories: CategoryDetail[];
    purpose_elements: PurposeElement[];
};

type LifeFrameData = {
    values: SelectedValue[];
    interests: InterestData;
    lifeCategories: LifeCategoriesData;
};

// SVG Icons
const ValueIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const InterestIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l2.12 6.56h6.88l-5.57 4.05 2.13 6.57L12 15.82l-5.56 4.05 2.13-6.57L3 9.25h6.88z" />
    </svg>
);

const CategoryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
    </svg>
);

const PurposeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);

export default function LifeFrameConstellation() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [lifeFrameData, setLifeFrameData] = useState<LifeFrameData | null>(null);
    const [activeSection, setActiveSection] = useState<'intro' | 'values' | 'interests' | 'categories' | 'purpose'>('intro');
    const [showConfetti, setShowConfetti] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    // Manual scroll tracking (no Framer Motion scroll hook)
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const scrollTop = window.scrollY;
            const scrollHeight = container.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

            setScrollProgress(progress);

            // Update active section
            if (progress < 0.2) setActiveSection('intro');
            else if (progress < 0.4) setActiveSection('values');
            else if (progress < 0.6) setActiveSection('interests');
            else if (progress < 0.8) setActiveSection('categories');
            else {
                setActiveSection('purpose');
                // Trigger confetti as soon as Purpose section is active (at 80% scroll)
                if (progress >= 0.8 && !showConfetti) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showConfetti]);

    // Calculate section opacities based on scroll progress
    const getOpacity = (start: number, fadeIn: number, fadeOut: number, end: number) => {
        if (scrollProgress < start) return 0;
        if (scrollProgress < fadeIn) return (scrollProgress - start) / (fadeIn - start);
        if (scrollProgress < fadeOut) return 1;
        if (scrollProgress < end) return 1 - (scrollProgress - fadeOut) / (end - fadeOut);
        return 0;
    };

    const introOpacity = scrollProgress < 0.1 ? 1 : 1 - (scrollProgress - 0) / 0.1;
    const valuesOpacity = getOpacity(0.1, 0.2, 0.3, 0.4);
    const interestsOpacity = getOpacity(0.3, 0.4, 0.5, 0.6);
    const categoriesOpacity = getOpacity(0.5, 0.6, 0.7, 0.8);
    const purposeOpacity = scrollProgress > 0.7 ? (scrollProgress - 0.7) / 0.1 : 0;

    useEffect(() => {
        const loadLifeFrame = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (error) throw error;

                const valuesData = worksheets?.find(w => w.category === 'values');
                const interestsData = worksheets?.find(w => w.category === 'interests');
                const categoriesData = worksheets?.find(w => w.category === 'life_categories');

                if (valuesData && interestsData && categoriesData) {
                    setLifeFrameData({
                        values: valuesData.content.selected_values || [],
                        interests: interestsData.content || { existing: [], exploring: [] },
                        lifeCategories: categoriesData.content || { categories: [], purpose_elements: [] }
                    });
                }
            } catch (error) {
                console.error('Error loading LifeFrame:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLifeFrame();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading your constellation...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
            {/* Constellation Map - Sticky */}
            <ConstellationMap activeSection={activeSection} />

            {/* Skip Navigation */}
            <div className="fixed top-6 left-6 z-40 flex gap-2">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition"
                >
                    ← Dashboard
                </button>
                <button
                    onClick={() => router.push('/roadmap')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    Skip to Roadmap →
                </button>
            </div>

            {/* Print & Share Buttons - Top Right */}
            <div className="fixed top-6 right-6 z-40 flex gap-2">
                <button
                    onClick={() => router.push('/lifeframe/print')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                    title="Print LifeFrame"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="hidden md:inline">Print</span>
                </button>
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'My LifeFrame',
                                text: 'Check out my LifeFrame - my values, interests, and purpose!',
                                url: window.location.href
                            }).catch(() => {
                                // User cancelled or share failed
                            });
                        } else {
                            // Fallback: Copy link to clipboard
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                        }
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                    title="Share LifeFrame"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden md:inline">Share</span>
                </button>
            </div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-30%',
                                backgroundColor: ['#fbbf24', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* SECTION 1: INTRO */}
            <section
                style={{ opacity: introOpacity }}
                className="min-h-screen flex items-center justify-center px-4 transition-opacity duration-500"
            >
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-8">
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-scale-in">
                            <span className="text-6xl">✨</span>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 animate-fade-up">
                        Your LifeFrame
                    </h1>
                    <p className="text-2xl text-purple-200 mb-12 animate-fade-up-delay">
                        A constellation of what matters most
                    </p>
                    <div className="text-white animate-fade-in-slow">
                        <p className="mb-2">Scroll to begin your journey</p>
                        <svg className="w-6 h-6 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* SECTION 2: VALUES */}
            <section
                style={{ opacity: valuesOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 transition-opacity duration-500"
            >
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'values'
                                        ? '0 0 60px rgba(168, 85, 247, 0.8)'
                                        : '0 0 20px rgba(168, 85, 247, 0.3)'
                                }}
                            >
                                <ValueIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4">Your Values</h2>
                        <p className="text-xl text-purple-200">Principles that guide your life</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {lifeFrameData?.values.map((value, index) => (
                            <div
                                key={value.name}
                                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-fade-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {value.priority}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{value.name}</h3>
                                        <p className="text-purple-200 text-sm">{value.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => router.push('/workbook/values')}
                            className="text-purple-300 hover:text-white transition"
                        >
                            ✏️ Edit Values
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 3: INTERESTS */}
            <section
                style={{ opacity: interestsOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 transition-opacity duration-500"
            >
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'interests'
                                        ? '0 0 60px rgba(236, 72, 153, 0.8)'
                                        : '0 0 20px rgba(236, 72, 153, 0.3)'
                                }}
                            >
                                <InterestIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4">Your Interests</h2>
                        <p className="text-xl text-pink-200">Activities that bring you joy</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                            <span>✓</span> Currently Enjoying
                        </h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {lifeFrameData?.interests.existing.map((interest, index) => (
                                <div
                                    key={interest}
                                    className="px-4 py-2 bg-pink-500/20 backdrop-blur-sm rounded-full border border-pink-400/50 text-white hover:bg-pink-500/30 transition hover:scale-110 animate-pop-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                            <span>⭐</span> Want to Explore
                        </h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {lifeFrameData?.interests.exploring.map((interest, index) => (
                                <div
                                    key={interest}
                                    className="px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/50 text-white hover:bg-purple-500/30 transition hover:scale-110 animate-pop-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => router.push('/workbook/interests')}
                            className="text-pink-300 hover:text-white transition"
                        >
                            ✏️ Edit Interests
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 4: CATEGORIES */}
            <section
                style={{ opacity: categoriesOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 transition-opacity duration-500"
            >
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'categories'
                                        ? '0 0 60px rgba(99, 102, 241, 0.8)'
                                        : '0 0 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <CategoryIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4">Life Categories</h2>
                        <p className="text-xl text-indigo-200">Areas where you'll set goals</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {lifeFrameData?.lifeCategories.categories.map((category, index) => (
                            <div
                                key={category.name}
                                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:border-indigo-400 transition-all animate-slide-in"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationDirection: index % 2 === 0 ? 'normal' : 'reverse'
                                }}
                            >
                                <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                                {category.subCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {category.subCategories.map((sub) => (
                                            <span
                                                key={sub}
                                                className="text-xs px-2 py-1 bg-indigo-500/30 rounded-full text-indigo-200"
                                            >
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => router.push('/workbook/life-categories')}
                            className="text-indigo-300 hover:text-white transition"
                        >
                            ✏️ Edit Categories
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 5: PURPOSE */}
            <section
                style={{ opacity: purposeOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 transition-opacity duration-500"
            >
                <div className="max-w-4xl w-full text-center">
                    <div className="mb-12">
                        <div className="w-40 h-40 mx-auto mb-8 relative">
                            <div
                                className="w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'purpose'
                                        ? '0 0 100px rgba(251, 191, 36, 1), 0 0 200px rgba(251, 191, 36, 0.5)'
                                        : '0 0 40px rgba(251, 191, 36, 0.3)'
                                }}
                            >
                                <PurposeIcon className="w-20 h-20 text-white" />
                            </div>
                            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin-slow" style={{ transform: 'scale(1.3)' }} />
                            <div className="absolute inset-0 border-2 border-orange-400/30 rounded-full animate-spin-slower" style={{ transform: 'scale(1.5)' }} />
                        </div>
                        <h2 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 mb-6">
                            Your Purpose
                        </h2>
                        <p className="text-2xl text-yellow-200 mb-12">
                            How you'll make a positive impact
                        </p>
                    </div>

                    <div className="space-y-6 mb-12">
                        {lifeFrameData?.lifeCategories.purpose_elements.map((element, index) => (
                            <div
                                key={element.name}
                                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-400/50 animate-fade-up"
                                style={{ animationDelay: `${index * 200}ms` }}
                            >
                                <h3 className="text-3xl font-bold text-white mb-3">{element.name}</h3>
                                {element.description && (
                                    <p className="text-xl text-yellow-100">{element.description}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 animate-fade-in-slow">
                        <p className="text-2xl text-white mb-6">
                            Your LifeFrame is complete! 🎉
                        </p>
                        <p className="text-lg text-purple-200 mb-8">
                            Now build your Roadmap with goals and activities aligned with these values and purpose.
                        </p>
                        <button
                            onClick={() => router.push('/roadmap')}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all transform hover:scale-105"
                        >
                            Build Your Roadmap →
                        </button>
                    </div>
                </div>
            </section>

            {/* Spacer */}
            <div className="h-screen" />

            <style jsx global>{`
                @keyframes confetti {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes scale-in {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }
                @keyframes fade-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pop-in {
                    from {
                        opacity: 0;
                        transform: scale(0);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes spin-slow {
                    from {
                        transform: scale(1.3) rotate(0deg);
                    }
                    to {
                        transform: scale(1.3) rotate(360deg);
                    }
                }
                @keyframes spin-slower {
                    from {
                        transform: scale(1.5) rotate(0deg);
                    }
                    to {
                        transform: scale(1.5) rotate(-360deg);
                    }
                }
                .animate-confetti {
                    animation: confetti forwards;
                }
                .animate-scale-in {
                    animation: scale-in 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .animate-fade-up {
                    animation: fade-up 0.6s ease-out;
                }
                .animate-fade-up-delay {
                    animation: fade-up 0.6s ease-out 0.2s backwards;
                }
                .animate-fade-in-slow {
                    animation: fade-up 0.6s ease-out 0.5s backwards;
                }
                .animate-pop-in {
                    animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
                }
                .animate-slide-in {
                    animation: slide-in 0.5s ease-out backwards;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-slower {
                    animation: spin-slower 15s linear infinite;
                }
            `}</style>
        </div>
    );
}