'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type WelcomeAnimationProps = {
    onComplete: () => void;
    userName?: string;
};

export default function WelcomeAnimation({ onComplete, userName }: WelcomeAnimationProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const traits = [
        {
            number: 1,
            title: 'Positivity',
            description: 'Gratitude, resilience, and optimism can transform your experiences and attract positive people',
            icon: '✨',
            gradient: 'from-yellow-400 to-orange-500'
        },
        {
            number: 2,
            title: 'Defining Success on Your Own Terms',
            description: 'Ignore external pressures and stay focused on what aligns with your purpose',
            icon: '🎯',
            gradient: 'from-blue-500 to-purple-600'
        },
        {
            number: 3,
            title: 'Continuous Improvement',
            description: 'Transform ordinary potential into extraordinary impact through growth',
            icon: '📈',
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            number: 4,
            title: 'Doing Good',
            description: 'Kindness and moral compass strengthen your character and influence',
            icon: '💚',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            number: 5,
            title: 'Open-Mindedness',
            description: 'Flexibility and curiosity fuel long-term growth',
            icon: '🧠',
            gradient: 'from-purple-500 to-pink-600'
        },
        {
            number: 6,
            title: 'Being Your Word',
            description: 'Living authentically builds a reputation that opens doors',
            icon: '🤝',
            gradient: 'from-indigo-500 to-blue-600'
        },
        {
            number: 7,
            title: 'Minimizing Regrets',
            description: 'Deploy a bias for action and always do your best',
            icon: '🚀',
            gradient: 'from-orange-500 to-red-600'
        },
        {
            number: 8,
            title: 'Willingness to Change',
            description: 'Small behavior changes can transform your health, relationships, and goals',
            icon: '🔄',
            gradient: 'from-cyan-500 to-blue-600'
        },
        {
            number: 9,
            title: 'Generosity',
            description: 'Sharing knowledge and kindness builds richer lives for all',
            icon: '🎁',
            gradient: 'from-pink-500 to-rose-600'
        }
    ];

    useEffect(() => {
        // Slide 0: Welcome - 3 seconds
        if (currentSlide === 0) {
            const timer = setTimeout(() => setCurrentSlide(1), 3000);
            return () => clearTimeout(timer);
        }

        // Slide 1: About Tim - 4 seconds
        if (currentSlide === 1) {
            const timer = setTimeout(() => setCurrentSlide(2), 4000);
            return () => clearTimeout(timer);
        }

        // Slides 2-10: Traits - 2.5 seconds each
        if (currentSlide >= 2 && currentSlide < 2 + traits.length) {
            const timer = setTimeout(() => setCurrentSlide(currentSlide + 1), 2500);
            return () => clearTimeout(timer);
        }

        // After all slides, fade out
        if (currentSlide >= 2 + traits.length) {
            const timer = setTimeout(() => handleComplete(), 1000);
            return () => clearTimeout(timer);
        }
    }, [currentSlide]);

    const handleComplete = async () => {
        setIsVisible(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ welcome_seen: true })
                .eq('id', user.id);
        }

        setTimeout(() => onComplete(), 500);
    };

    const handleSkip = () => {
        handleComplete();
    };

    // Slide 0: Welcome
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-6 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition text-sm font-medium border border-white/30"
                >
                    Skip Animation →
                </button>

                <div className="text-center px-8 max-w-3xl">
                    {/* Modern Logo */}
                    <div className="mb-8 animate-scale-in">
                        <div className="w-28 h-28 bg-gradient-to-br from-white to-white/90 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform">
                            <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h1 className="text-7xl font-bold text-white mb-4 animate-fade-in-up">
                            LifeAligner
                        </h1>
                    </div>

                    {/* Welcome Text */}
                    <div className="space-y-4 animate-fade-in-up-delay">
                        <h2 className="text-4xl font-bold text-white">
                            Welcome{userName ? `, ${userName}` : ''}!
                        </h2>
                        <p className="text-2xl text-white/90 font-light">
                            Your journey to contentment starts now
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-12 w-32 h-1 bg-white/30 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-progress-3s"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Slide 1: About Tim with Photo
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition text-sm font-medium border border-white/20"
                >
                    Skip Animation →
                </button>

                <div className="max-w-5xl px-8 w-full">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Tim's Photo */}
                            <div className="flex-shrink-0 animate-scale-in">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                                    <Image
                                        src="/illistrations/tim-collins.webp"
                                        alt="Tim Collins"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 animate-fade-in-up">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Tim Collins</h2>
                                    <p className="text-xl text-purple-300">Creator of LifeAligner</p>
                                </div>

                                <div className="space-y-3 text-white/90 text-base leading-relaxed">
                                    <p>
                                        Co-founded <strong className="text-white">EBSCO</strong>, the world&apos;s leading online research service.
                                        Grew it to <strong className="text-white">$2B in sales</strong> through 70+ acquisitions.
                                    </p>
                                    <p>
                                        After his 2024 <strong className="text-white">TEDx talk</strong> on &quot;Redefining Contentment,&quot;
                                        Tim created the LifeAligner Framework to share tools he&apos;s used for decades.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6 w-48 h-1 bg-white/20 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-progress-4s"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Slides 2-10: 9 Traits
    if (currentSlide >= 2 && currentSlide < 2 + traits.length) {
        const trait = traits[currentSlide - 2];
        const progress = ((currentSlide - 1) / (traits.length + 1)) * 100;

        return (
            <div className={`fixed inset-0 bg-gradient-to-br ${trait.gradient} z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-6 px-4 py-2 bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white rounded-xl transition text-sm font-medium border border-white/30"
                >
                    Skip Animation →
                </button>

                {/* Progress dots */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {traits.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index + 2 === currentSlide
                                    ? 'bg-white w-12'
                                    : index + 2 < currentSlide
                                        ? 'bg-white/60 w-6'
                                        : 'bg-white/20 w-6'
                                }`}
                        />
                    ))}
                </div>

                <div className="max-w-3xl px-8 text-center">
                    {/* Icon with modern styling */}
                    <div className="text-8xl mb-6 animate-bounce-in drop-shadow-2xl">
                        {trait.icon}
                    </div>

                    {/* Number badge */}
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-white font-bold text-sm mb-6 border border-white/30 animate-fade-in">
                        {trait.number} of 9
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 animate-fade-in-up drop-shadow-lg">
                        {trait.title}
                    </h2>

                    {/* Description */}
                    <p className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-2xl mx-auto animate-fade-in-up-delay">
                        {trait.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-10 w-64 h-1 bg-white/20 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-progress-2-5s"></div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
