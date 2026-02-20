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
    const [carPosition, setCarPosition] = useState(0);

    const landmarks = [
        { num: 1, title: 'Positivity', desc: 'Start your journey with gratitude', landmark: '🏔️', color: 'from-yellow-400 to-orange-500' },
        { num: 2, title: 'Define Success', desc: 'Choose your own path', landmark: '🌲', color: 'from-blue-500 to-purple-600' },
        { num: 3, title: 'Continuous Improvement', desc: 'Climb higher every day', landmark: '⛰️', color: 'from-green-500 to-emerald-600' },
        { num: 4, title: 'Doing Good', desc: 'Leave kindness in your wake', landmark: '🌳', color: 'from-emerald-500 to-teal-600' },
        { num: 5, title: 'Open-Mindedness', desc: 'Explore new perspectives', landmark: '🌉', color: 'from-purple-500 to-pink-600' },
        { num: 6, title: 'Being Your Word', desc: 'Stay true to your course', landmark: '🏛️', color: 'from-indigo-500 to-blue-600' },
        { num: 7, title: 'Minimize Regrets', desc: 'Drive forward with purpose', landmark: '🎯', color: 'from-orange-500 to-red-600' },
        { num: 8, title: 'Willingness to Change', desc: 'Adapt to new terrain', landmark: '🌊', color: 'from-cyan-500 to-blue-600' },
        { num: 9, title: 'Generosity', desc: 'Share the journey with others', landmark: '🏡', color: 'from-pink-500 to-rose-600' }
    ];

    useEffect(() => {
        // Slide 0: Welcome (3s)
        // Slide 1: Tim (4s)
        // Slides 2-10: Landmarks (3s each for smooth car travel)
        // Slide 11: Arrived (3s)
        const timings = [3000, 4000, ...Array(9).fill(3000), 3000];

        const timer = setTimeout(() => {
            if (currentSlide < timings.length - 1) {
                setCurrentSlide(currentSlide + 1);
                // Animate car position for landmark slides
                if (currentSlide >= 1 && currentSlide <= 9) {
                    setCarPosition(prev => prev + 10);
                }
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

    // Slide 0: Welcome - Car approaching
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-green-200 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* Sky & Clouds */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 text-6xl animate-float-slow">☁️</div>
                    <div className="absolute top-20 right-20 text-7xl animate-float-slower">☁️</div>
                    <div className="absolute top-32 left-1/3 text-5xl animate-float">☁️</div>
                </div>

                {/* Mountains (far) */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/20 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1200 200" className="w-full">
                            <polygon points="0,200 0,100 200,80 400,120 600,60 800,100 1000,80 1200,110 1200,200" fill="#4a5568" opacity="0.3" />
                        </svg>
                    </div>
                </div>

                {/* Trees (mid) */}
                <div className="absolute bottom-20 left-0 right-0 flex justify-around items-end animate-slide-left-slow">
                    <div className="text-6xl">🌲</div>
                    <div className="text-7xl">🌲</div>
                    <div className="text-5xl">🌲</div>
                    <div className="text-8xl">🌲</div>
                    <div className="text-6xl">🌲</div>
                </div>

                {/* Road */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-600">
                    <div className="h-2 bg-yellow-300 mt-8 mx-auto w-full flex justify-around">
                        <div className="w-16 h-full animate-road-line"></div>
                        <div className="w-16 h-full animate-road-line" style={{ animationDelay: '0.5s' }}></div>
                        <div className="w-16 h-full animate-road-line" style={{ animationDelay: '1s' }}></div>
                        <div className="w-16 h-full animate-road-line" style={{ animationDelay: '1.5s' }}></div>
                    </div>
                </div>

                {/* Car entering */}
                <div className="absolute bottom-24 left-0 text-8xl animate-car-enter">
                    🚗
                </div>

                {/* Welcome Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center animate-fade-in-up">
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-white/90 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-lg">
                                LifeAligner
                            </h1>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                            Welcome{userName ? `, ${userName}` : ''}!
                        </h2>
                        <p className="text-2xl text-white/90 drop-shadow-lg">
                            Your journey begins...
                        </p>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-blue-600 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slide 1: Tim - Pit Stop
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-slate-700 via-slate-600 to-green-300 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* Sky */}
                <div className="absolute top-16 left-20 text-5xl animate-float-slow opacity-70">☁️</div>
                <div className="absolute top-24 right-32 text-6xl animate-float-slower opacity-70">☁️</div>

                {/* Mountains */}
                <div className="absolute bottom-0 left-0 right-0 h-48">
                    <svg viewBox="0 0 1200 150" className="w-full">
                        <polygon points="0,150 0,80 300,60 600,40 900,70 1200,50 1200,150" fill="#2d3748" opacity="0.4" />
                    </svg>
                </div>

                {/* Trees */}
                <div className="absolute bottom-20 left-0 right-0 flex justify-around">
                    <div className="text-5xl opacity-60">🌲</div>
                    <div className="text-6xl opacity-60">🌲</div>
                    <div className="text-5xl opacity-60">🌲</div>
                </div>

                {/* Road */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-700"></div>

                {/* Parked Car */}
                <div className="absolute bottom-24 left-20 text-7xl">
                    🚗
                </div>

                {/* Tim Card */}
                <div className="absolute inset-0 flex items-center justify-center px-8">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 max-w-4xl shadow-2xl animate-scale-in">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-blue-500/30 shadow-xl">
                                    <Image
                                        src="/illustrations/tim-collins.webp"
                                        alt="Tim Collins"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-block px-4 py-1 bg-blue-100 rounded-full mb-3">
                                    <span className="text-blue-600 text-sm font-bold">Your Guide</span>
                                </div>
                                <h2 className="text-5xl font-bold text-gray-900 mb-3">Tim Collins</h2>
                                <p className="text-xl text-gray-700 mb-4 leading-relaxed">
                                    Built a <strong>$2B company</strong> using these 9 principles.
                                    Now he&apos;s sharing the roadmap with you.
                                </p>
                                <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                                    <p className="text-white text-sm font-semibold">Let&apos;s hit the road →</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slides 2-10: Landmarks
    if (currentSlide >= 2 && currentSlide <= 10) {
        const landmarkIndex = currentSlide - 2;
        const landmark = landmarks[landmarkIndex];

        return (
            <div className={`fixed inset-0 bg-gradient-to-b ${landmark.color} z-50 overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* Sky & Clouds */}
                <div className="absolute top-12 left-16 text-5xl animate-float-slow opacity-80">☁️</div>
                <div className="absolute top-20 right-24 text-6xl animate-float-slower opacity-80">☁️</div>
                <div className="absolute top-32 left-1/2 text-4xl animate-float opacity-80">☁️</div>

                {/* Mountains (parallax) */}
                <div className="absolute bottom-0 left-0 right-0 h-56" style={{ transform: `translateX(-${carPosition * 2}px)` }}>
                    <svg viewBox="0 0 1200 180" className="w-full">
                        <polygon points="0,180 0,90 250,70 500,100 750,50 1000,80 1200,90 1200,180" fill="rgba(0,0,0,0.2)" />
                    </svg>
                </div>

                {/* Trees (parallax faster) */}
                <div className="absolute bottom-24 left-0 right-0 flex gap-32" style={{ transform: `translateX(-${carPosition * 5}px)` }}>
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="text-6xl opacity-70 flex-shrink-0">🌲</div>
                    ))}
                </div>

                {/* Road */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gray-800">
                    <div className="h-3 bg-yellow-400 mt-10 flex gap-8 animate-road-scroll">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="w-20 h-full bg-yellow-400 flex-shrink-0"></div>
                        ))}
                    </div>
                </div>

                {/* Car (centered) */}
                <div className="absolute bottom-28 left-1/4 text-8xl animate-car-bounce">
                    🚗💨
                </div>

                {/* Landmark Sign */}
                <div className="absolute bottom-32 right-1/4 animate-scale-in">
                    <div className="relative">
                        {/* Signpost */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-32 bg-amber-800"></div>

                        {/* Sign */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border-4 border-amber-700 min-w-[300px]">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="text-5xl">{landmark.landmark}</div>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                    {landmark.num}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{landmark.title}</h3>
                            <p className="text-gray-700">{landmark.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Road */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-96">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl rounded-full p-2 shadow-xl">
                        {landmarks.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < landmarkIndex ? 'bg-green-500' :
                                        i === landmarkIndex ? 'bg-blue-500' :
                                            'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-white text-sm mt-2 drop-shadow-lg font-semibold">
                        Stop {landmark.num} of 9
                    </p>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slide 11: Arrived at Destination
    if (currentSlide === 11) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-orange-400 via-pink-400 to-purple-500 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* Sunset Sky */}
                <div className="absolute top-20 right-20 text-8xl animate-pulse-slow">🌅</div>

                {/* Mountains */}
                <div className="absolute bottom-0 left-0 right-0 h-64">
                    <svg viewBox="0 0 1200 200" className="w-full">
                        <polygon points="0,200 0,100 400,60 800,100 1200,80 1200,200" fill="rgba(0,0,0,0.3)" />
                    </svg>
                </div>

                {/* Destination House */}
                <div className="absolute bottom-32 right-1/4 text-9xl animate-scale-in">
                    🏡
                </div>

                {/* Parked Car */}
                <div className="absolute bottom-28 right-1/3 text-7xl">
                    🚗
                </div>

                {/* Road */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gray-800"></div>

                {/* Success Message */}
                <div className="absolute inset-0 flex items-center justify-center px-8">
                    <div className="text-center animate-fade-in-up">
                        <div className="text-8xl mb-6 animate-bounce-in">🎉</div>
                        <h2 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                            You&apos;ve Arrived!
                        </h2>
                        <p className="text-3xl text-white/90 mb-8 drop-shadow-lg">
                            Ready to build your life roadmap
                        </p>
                        <button
                            onClick={handleComplete}
                            className="px-10 py-4 bg-white text-purple-600 rounded-2xl text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
                        >
                            Start My Workbook →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
