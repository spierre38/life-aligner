'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type WelcomeAnimationProps = {
    onComplete: () => void;
    userName?: string;
};

export default function WelcomeAnimation({ onComplete, userName }: WelcomeAnimationProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [showArrow, setShowArrow] = useState(false);

    const traits = [
        {
            number: 1,
            title: 'Positivity',
            description: 'Gratitude, resilience, and optimism can transform your experiences, attract positive people, and change the course of your life',
            icon: '✨',
            gradient: 'from-yellow-400 to-orange-500'
        },
        {
            number: 2,
            title: 'Defining Success on Their Own Terms',
            description: 'Ignoring external pressures and comparisons, and staying focused on what aligns with their purpose and goals',
            icon: '🎯',
            gradient: 'from-blue-500 to-purple-600'
        },
        {
            number: 3,
            title: 'Driving for Continuous Improvement',
            description: 'Choosing this over comfort can transform ordinary potential into extraordinary impact and even create your own "luck"',
            icon: '📈',
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            number: 4,
            title: 'Doing Good',
            description: 'Kindness, fairness, and a strong moral compass defines how others view you and strengthens your own character and influence',
            icon: '💚',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            number: 5,
            title: 'Open-Mindedness',
            description: 'Flexibility and curiosity work together to fuel long-term growth',
            icon: '🧠',
            gradient: 'from-purple-500 to-pink-600'
        },
        {
            number: 6,
            title: 'Being Your Word',
            description: 'Living authentically and honoring commitments builds a reputation that opens doors',
            icon: '🤝',
            gradient: 'from-indigo-500 to-blue-600'
        },
        {
            number: 7,
            title: 'Minimizing Regrets',
            description: 'Deploying a bias for action and always doing your best can lead to a life of few regrets',
            icon: '🚀',
            gradient: 'from-orange-500 to-red-600'
        },
        {
            number: 8,
            title: 'Willingness to Change Behavior',
            description: 'Intentionally changing behaviors, even in small ways, can transform your health, relationships, and ability to accomplish goals',
            icon: '🔄',
            gradient: 'from-cyan-500 to-blue-600'
        },
        {
            number: 9,
            title: 'Generosity',
            description: 'Sharing knowledge, volunteering, donating, and practicing kindness builds richer lives for both giver and receiver',
            icon: '🎁',
            gradient: 'from-pink-500 to-rose-600'
        }
    ];

    useEffect(() => {
        // Slide 0: Thank you / Welcome (page 31) - 4 seconds
        if (currentSlide === 0) {
            const timer = setTimeout(() => {
                setCurrentSlide(1);
            }, 4000);
            return () => clearTimeout(timer);
        }

        // Slide 1: About Tim Collins (page 30 top) - 5 seconds, then show arrow
        if (currentSlide === 1) {
            const arrowTimer = setTimeout(() => {
                setShowArrow(true);
            }, 4000); // Arrow appears after 4 seconds

            const nextTimer = setTimeout(() => {
                setCurrentSlide(2);
                setShowArrow(false);
            }, 5000); // Move to traits after 5 seconds total

            return () => {
                clearTimeout(arrowTimer);
                clearTimeout(nextTimer);
            };
        }

        // Slides 2-10: 9 Traits (page 30 bottom) - 4 seconds each
        if (currentSlide >= 2 && currentSlide < 2 + traits.length) {
            const timer = setTimeout(() => {
                setCurrentSlide(currentSlide + 1);
            }, 4000);
            return () => clearTimeout(timer);
        }

        // After all slides, fade out
        if (currentSlide >= 2 + traits.length) {
            const timer = setTimeout(() => {
                handleComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [currentSlide, showArrow]);

    const handleComplete = async () => {
        setIsVisible(false);

        // Mark welcome as seen in profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ welcome_seen: true })
                .eq('id', user.id);
        }

        setTimeout(() => {
            onComplete();
        }, 500);
    };

    const handleSkip = () => {
        handleComplete();
    };

    // Slide 0: Welcome / Thank You (Page 31)
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-8 right-8 text-white/70 hover:text-white transition text-sm font-medium"
                >
                    Skip →
                </button>

                <div className="text-center px-8 animate-fade-in max-w-3xl">
                    {/* LifeAligner Logo */}
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-6xl mx-auto mb-6 shadow-2xl">
                            🎯
                        </div>
                        <h1 className="text-7xl font-bold text-white mb-4">
                            LifeAligner
                        </h1>
                    </div>

                    {/* Thank You Message */}
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-white">
                            Thank You for Joining Us{userName ? `, ${userName}` : ''}!
                        </h2>
                        <p className="text-3xl text-white/90 font-light">
                            Welcome to your path to contentment
                        </p>
                    </div>

                    <div className="mt-12 w-20 h-1 bg-white/50 mx-auto rounded-full animate-pulse"></div>
                </div>
            </div>
        );
    }

    // Slide 1: About Tim Collins (Page 30 - Top)
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-8 right-8 text-white/70 hover:text-white transition text-sm font-medium"
                >
                    Skip →
                </button>

                <div className="max-w-4xl px-8 animate-fade-in">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-5xl font-bold text-white mb-3">About the Author</h2>
                            <div className="w-20 h-1 bg-white/50 mx-auto rounded-full"></div>
                        </div>

                        {/* Bio Content */}
                        <div className="space-y-4 text-white/90 text-lg leading-relaxed">
                            <p>
                                In 1983, while in college, <strong className="text-white">Tim Collins</strong> co-founded a company that became
                                <strong className="text-white"> EBSCOhost</strong>, the world's leading online research service for academic institutions.
                            </p>
                            <p>
                                He guided the company to very strong organic growth combined with more than <strong className="text-white">70 strategic acquisitions</strong> and
                                partnerships with hundreds of leading publishers. When Tim retired in 2024, EBSCO Information Services had over
                                <strong className="text-white"> $2B in sales</strong>.
                            </p>
                            <p>
                                In 2024, Tim gave a <strong className="text-white">TEDx talk</strong> on "Redefining Contentment" at Endicott College.
                                This experience motivated him to document the tools he created early in his life and used for decades
                                so that they could be shared with others as the <strong className="text-white">LifeAligner Framework</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Animated Arrow (appears after 4 seconds) */}
                    {showArrow && (
                        <div className="flex flex-col items-center mt-8 animate-fade-in">
                            <p className="text-white text-xl mb-4">Let's explore the 9 traits...</p>
                            <svg
                                className="w-12 h-12 text-white animate-bounce"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Slides 2-10: 9 Traits (Page 30 - Bottom)
    if (currentSlide >= 2 && currentSlide < 2 + traits.length) {
        const trait = traits[currentSlide - 2];

        return (
            <div className={`fixed inset-0 bg-gradient-to-br ${trait.gradient} z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-8 right-8 text-white/70 hover:text-white transition text-sm font-medium"
                >
                    Skip →
                </button>

                {/* Progress dots */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {traits.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${index + 2 === currentSlide
                                    ? 'bg-white w-8'
                                    : index + 2 < currentSlide
                                        ? 'bg-white/50'
                                        : 'bg-white/20'
                                }`}
                        ></div>
                    ))}
                </div>

                <div className="max-w-3xl px-8 text-center animate-fade-in">
                    {/* Icon */}
                    <div className="text-9xl mb-8 animate-bounce">
                        {trait.icon}
                    </div>

                    {/* Number badge */}
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-white font-bold text-lg mb-6">
                        Trait {trait.number} of 9
                    </div>

                    {/* Title */}
                    <h2 className="text-5xl font-bold text-white mb-6">
                        {trait.title}
                    </h2>

                    {/* Description */}
                    <p className="text-2xl text-white/90 leading-relaxed">
                        {trait.description}
                    </p>

                    {/* Next indicator */}
                    <div className="mt-12 text-white/50 text-sm animate-pulse">
                        {currentSlide < 2 + traits.length - 1 ? 'Next trait in 4 seconds...' : 'Starting your journey in 2 seconds...'}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
