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
        { num: 1, title: 'Positivity', desc: 'Gratitude and optimism transform experiences', icon: '✨', color: 'from-yellow-400 to-orange-500' },
        { num: 2, title: 'Define Success Your Way', desc: 'Stay focused on what aligns with your purpose', icon: '🎯', color: 'from-blue-500 to-purple-600' },
        { num: 3, title: 'Continuous Improvement', desc: 'Transform potential into extraordinary impact', icon: '📈', color: 'from-green-500 to-emerald-600' },
        { num: 4, title: 'Doing Good', desc: 'Kindness strengthens character and influence', icon: '💚', color: 'from-emerald-500 to-teal-600' },
        { num: 5, title: 'Open-Mindedness', desc: 'Flexibility and curiosity fuel growth', icon: '🧠', color: 'from-purple-500 to-pink-600' },
        { num: 6, title: 'Being Your Word', desc: 'Authenticity builds a reputation that opens doors', icon: '🤝', color: 'from-indigo-500 to-blue-600' },
        { num: 7, title: 'Minimize Regrets', desc: 'Deploy a bias for action', icon: '🚀', color: 'from-orange-500 to-red-600' },
        { num: 8, title: 'Willingness to Change', desc: 'Small changes transform everything', icon: '🔄', color: 'from-cyan-500 to-blue-600' },
        { num: 9, title: 'Generosity', desc: 'Sharing builds richer lives for all', icon: '🎁', color: 'from-pink-500 to-rose-600' }
    ];

    useEffect(() => {
        const timings = [2000, 4000, 3000, ...Array(9).fill(2000), 2000]; // Welcome, Tim, Intro, 9 traits, Final
        const timer = setTimeout(() => {
            if (currentSlide < timings.length - 1) {
                setCurrentSlide(currentSlide + 1);
            } else {
                handleComplete();
            }
        }, timings[currentSlide]);

        return () => clearTimeout(timer);
    }, [currentSlide]);

    const handleComplete = async () => {
        setIsVisible(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ welcome_seen: true }).eq('id', user.id);
        }
        setTimeout(() => onComplete(), 500);
    };

    const totalSlides = 12;
    const progress = ((currentSlide + 1) / totalSlides) * 100;

    // Slide 0: Thank You
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-2xl transition-all text-sm font-semibold border border-white/30 shadow-2xl hover:scale-105 z-10">
                    Skip Introduction →
                </button>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 4}s`
                            }}
                        />
                    ))}
                </div>

                <div className="text-center px-8 max-w-4xl relative z-10">
                    <div className="mb-10 animate-scale-in-slow">
                        <div className="w-32 h-32 bg-white/95 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <svg className="w-20 h-20 text-transparent relative z-10" fill="url(#logo-gradient)" viewBox="0 0 24 24">
                                <defs>
                                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h1 className="text-7xl md:text-8xl font-bold text-white mb-4 tracking-tight animate-fade-in-up">
                            LifeAligner
                        </h1>
                    </div>

                    <div className="space-y-6 animate-fade-in-up-delay-1">
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Thank You{userName ? `, ${userName}` : ''}!
                        </h2>
                        <p className="text-2xl md:text-3xl text-white/90 font-light leading-relaxed">
                            Your journey to contentment begins now
                        </p>
                    </div>

                    <div className="mt-16 flex justify-center">
                        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-gradient-to-r from-white to-white/80 rounded-full animate-progress-2s shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Slide 1: About Tim
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-5"></div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl transition-all text-sm font-semibold border border-white/20 shadow-2xl hover:scale-105 z-10">
                    Skip Introduction →
                </button>

                <div className="max-w-6xl px-8 w-full relative z-10">
                    <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] p-10 md:p-14 border border-white/20 shadow-2xl animate-scale-in">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-shrink-0 animate-slide-in-left">
                                <div className="relative w-56 h-56 rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 group-hover:opacity-0 transition-opacity z-10"></div>
                                    <Image
                                        src="/illustrations/tim-collins.webp"
                                        alt="Tim Collins"
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        priority
                                    />
                                </div>
                            </div>

                            <div className="flex-1 animate-fade-in-up-delay-1">
                                <div className="mb-6">
                                    <div className="inline-block px-4 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/30 mb-4">
                                        <span className="text-purple-300 text-sm font-semibold">Created by</span>
                                    </div>
                                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">Tim Collins</h2>
                                </div>

                                <div className="space-y-4 text-white/90 text-lg leading-relaxed">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <p>Co-founded <strong className="text-white font-semibold">EBSCO</strong>, the world&apos;s leading online research service</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <p>Grew to <strong className="text-white font-semibold">$2B in sales</strong> through 70+ strategic acquisitions</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <p>Delivered a <strong className="text-white font-semibold">TEDx talk</strong> on &quot;Redefining Contentment&quot; in 2024</p>
                                    </div>
                                </div>

                                <div className="mt-8 p-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-400/20">
                                    <p className="text-white/95 text-base leading-relaxed italic">
                                        &quot;I&apos;ve used these principles for 40 years. Now I&apos;m sharing them with you.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-progress-4s shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Slide 2: Introduction to 9 Traits
    if (currentSlide === 2) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[url('/patterns/circuit-board.svg')] opacity-10"></div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl transition-all text-sm font-semibold border border-white/20 shadow-2xl hover:scale-105 z-10">
                    Skip Introduction →
                </button>

                <div className="text-center px-8 max-w-5xl relative z-10">
                    <div className="mb-12 animate-fade-in-up">
                        <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/30 mb-8">
                            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">The Framework</span>
                        </div>
                        <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                            The 9 Traits of<br />Contented People
                        </h2>
                        <p className="text-2xl text-white/80 leading-relaxed max-w-3xl mx-auto">
                            Based on 40 years of research and real-world application
                        </p>
                    </div>

                    {/* Icon Circle */}
                    <div className="relative w-[400px] h-[400px] mx-auto mb-12 animate-scale-in-slow">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
                        {traits.map((trait, i) => {
                            const angle = (i / traits.length) * 2 * Math.PI - Math.PI / 2;
                            const x = 160 * Math.cos(angle);
                            const y = 160 * Math.sin(angle);
                            return (
                                <div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-3xl border border-white/30 shadow-2xl animate-pulse-slow"
                                    style={{
                                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                >
                                    {trait.icon}
                                </div>
                            );
                        })}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-7xl animate-float">✨</div>
                        </div>
                    </div>

                    <p className="text-xl text-white/70 animate-fade-in-up-delay-2">
                        Let&apos;s explore each one...
                    </p>

                    <div className="mt-12 flex justify-center">
                        <div className="w-80 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-progress-3s shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Slides 3-11: Individual Traits
    if (currentSlide >= 3 && currentSlide <= 11) {
        const traitIndex = currentSlide - 3;
        const trait = traits[traitIndex];

        return (
            <div className={`fixed inset-0 bg-gradient-to-br ${trait.color} z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[url('/patterns/texture.svg')] opacity-10"></div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-black/20 hover:bg-black/30 backdrop-blur-xl text-white rounded-2xl transition-all text-sm font-semibold border border-white/30 shadow-2xl hover:scale-105 z-10">
                    Skip Introduction →
                </button>

                {/* Progress Indicator */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                    {traits.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === traitIndex ? 'bg-white w-16 shadow-lg' :
                                i < traitIndex ? 'bg-white/60 w-8' :
                                    'bg-white/20 w-8'
                                }`}
                        />
                    ))}
                </div>

                <div className="max-w-4xl px-8 text-center relative z-10">
                    {/* Number Badge */}
                    <div className="mb-8 animate-scale-in">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl text-white font-bold text-2xl border-2 border-white/40 shadow-2xl">
                            {trait.num}
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="text-9xl mb-8 animate-bounce-in drop-shadow-2xl" style={{ animationDelay: '0.2s' }}>
                        {trait.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight animate-fade-in-up drop-shadow-lg tracking-tight">
                        {trait.title}
                    </h2>

                    {/* Description */}
                    <p className="text-2xl md:text-3xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in-up-delay-1 font-light">
                        {trait.desc}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-16 flex justify-center">
                        <div className="w-72 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-white rounded-full animate-progress-2s shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Final Slide: Let's Begin
    if (currentSlide === 12) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-10"></div>

                {/* Confetti particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                backgroundColor: ['#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                <div className="text-center px-8 max-w-4xl relative z-10">
                    <div className="mb-12 animate-scale-in">
                        <div className="text-8xl mb-8 animate-bounce">🎉</div>
                        <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                            You&apos;re Ready!
                        </h2>
                        <p className="text-3xl text-white/90 leading-relaxed font-light">
                            Let&apos;s start building your LifeAligner workbook
                        </p>
                    </div>

                    <button
                        onClick={handleComplete}
                        className="mt-12 px-12 py-5 bg-white text-teal-600 rounded-2xl text-xl font-bold shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-300 animate-fade-in-up-delay-1"
                    >
                        Start My Workbook →
                    </button>

                    <div className="mt-12 flex justify-center">
                        <div className="w-72 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-white rounded-full animate-progress-2s shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
