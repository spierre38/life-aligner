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

    const landmarks = [
        { num: 1, title: 'Positivity', desc: 'Start with gratitude and optimism', color: '#F59E0B', bgColor: 'from-amber-400 to-orange-400' },
        { num: 2, title: 'Define Success', desc: 'Choose your own path forward', color: '#3B82F6', bgColor: 'from-blue-400 to-indigo-500' },
        { num: 3, title: 'Continuous Improvement', desc: 'Climb higher every day', color: '#10B981', bgColor: 'from-emerald-400 to-green-500' },
        { num: 4, title: 'Doing Good', desc: 'Leave kindness in your wake', color: '#14B8A6', bgColor: 'from-teal-400 to-cyan-500' },
        { num: 5, title: 'Open-Mindedness', desc: 'Explore new perspectives', color: '#8B5CF6', bgColor: 'from-violet-400 to-purple-500' },
        { num: 6, title: 'Being Your Word', desc: 'Stay true to your course', color: '#6366F1', bgColor: 'from-indigo-400 to-blue-500' },
        { num: 7, title: 'Minimize Regrets', desc: 'Drive forward with purpose', color: '#EF4444', bgColor: 'from-red-400 to-rose-500' },
        { num: 8, title: 'Embrace Change', desc: 'Adapt to new terrain', color: '#06B6D4', bgColor: 'from-cyan-400 to-sky-500' },
        { num: 9, title: 'Generosity', desc: 'Share the journey with others', color: '#EC4899', bgColor: 'from-pink-400 to-fuchsia-500' }
    ];

    useEffect(() => {
        const timings = [3000, 4000, ...Array(9).fill(3000), 3000];
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

    // Shared background elements
    const Background = ({ skyColor = 'from-sky-400 to-blue-300', hasSnow = true }: { skyColor?: string; hasSnow?: boolean }) => (
        <>
            {/* Sky gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${skyColor}`}></div>

            {/* Floating particles/snow */}
            {hasSnow && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                animation: `fall ${5 + Math.random() * 5}s linear infinite`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Mountains - far background */}
            <div className="absolute bottom-0 left-0 right-0 h-64" style={{ transform: 'translateX(-10%)' }}>
                <svg className="absolute bottom-0 w-full h-full animate-parallax-slow" viewBox="0 0 1400 300" preserveAspectRatio="none">
                    <path d="M0,300 L0,150 Q200,100 400,140 T800,120 T1200,160 L1400,180 L1400,300 Z" fill="#4B5563" opacity="0.3" />
                </svg>
                <svg className="absolute bottom-0 w-full h-full animate-parallax-slower" viewBox="0 0 1400 250" preserveAspectRatio="none">
                    <path d="M0,250 L0,120 Q250,80 500,110 T900,90 T1300,130 L1400,150 L1400,250 Z" fill="#374151" opacity="0.4" />
                </svg>
            </div>

            {/* Trees - middle ground */}
            <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden">
                <div className="absolute bottom-0 flex gap-16 animate-trees-scroll" style={{ width: '200%' }}>
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="flex-shrink-0">
                            <svg width="60" height="120" viewBox="0 0 60 120">
                                <rect x="24" y="70" width="12" height="50" fill="#78350F" rx="2" />
                                <path d="M30,70 L15,50 L10,50 L30,10 L50,50 L45,50 Z" fill="#166534" />
                                <path d="M30,55 L18,38 L14,38 L30,5 L46,38 L42,38 Z" fill="#15803D" />
                                <path d="M30,40 L20,26 L17,26 L30,0 L43,26 L40,26 Z" fill="#16A34A" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>

            {/* Road */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-700 to-gray-800">
                <div className="absolute top-1/2 left-0 right-0 h-1 flex gap-12 animate-road-lines">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="w-16 h-full bg-yellow-300 flex-shrink-0 opacity-80"></div>
                    ))}
                </div>
            </div>
        </>
    );

    // Car illustration component
    const Car = ({ className = "", color = "#3B82F6" }: { className?: string; color?: string }) => (
        <svg className={className} width="180" height="90" viewBox="0 0 180 90" fill="none">
            {/* Shadow */}
            <ellipse cx="90" cy="85" rx="70" ry="8" fill="black" opacity="0.2" />

            {/* Car body */}
            <path d="M30,55 L40,35 L80,35 L90,45 L150,45 L150,65 L30,65 Z" fill={color} />
            <path d="M150,45 L150,65 L155,65 L160,60 L160,50 Z" fill={color} opacity="0.8" />

            {/* Windows */}
            <path d="M45,40 L70,40 L75,45 L45,45 Z" fill="#60A5FA" opacity="0.6" />
            <path d="M85,45 L140,45 L140,50 L85,50 Z" fill="#60A5FA" opacity="0.6" />

            {/* Wheels */}
            <circle cx="50" cy="65" r="12" fill="#1F2937" />
            <circle cx="50" cy="65" r="8" fill="#374151" />
            <circle cx="50" cy="65" r="4" fill="#6B7280" />
            <circle cx="130" cy="65" r="12" fill="#1F2937" />
            <circle cx="130" cy="65" r="8" fill="#374151" />
            <circle cx="130" cy="65" r="4" fill="#6B7280" />

            {/* Details */}
            <circle cx="155" cy="55" r="3" fill="#FDE047" className="animate-pulse" />
            <rect x="32" y="65" width="3" height="5" fill="#DC2626" rx="1" />
        </svg>
    );

    // Slide 0: Welcome
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Background skyColor="from-sky-400 via-blue-300 to-cyan-200" />

                {/* Clouds */}
                <div className="absolute top-20 left-20 animate-float-cloud" style={{ animationDelay: '0s' }}>
                    <svg width="150" height="80" viewBox="0 0 150 80">
                        <ellipse cx="40" cy="50" rx="30" ry="20" fill="white" opacity="0.9" />
                        <ellipse cx="65" cy="40" rx="35" ry="25" fill="white" opacity="0.9" />
                        <ellipse cx="95" cy="45" rx="30" ry="22" fill="white" opacity="0.9" />
                    </svg>
                </div>
                <div className="absolute top-32 right-32 animate-float-cloud" style={{ animationDelay: '2s' }}>
                    <svg width="200" height="100" viewBox="0 0 200 100">
                        <ellipse cx="50" cy="60" rx="35" ry="25" fill="white" opacity="0.85" />
                        <ellipse cx="85" cy="50" rx="45" ry="35" fill="white" opacity="0.85" />
                        <ellipse cx="130" cy="55" rx="40" ry="30" fill="white" opacity="0.85" />
                    </svg>
                </div>

                {/* Car entering */}
                <div className="absolute bottom-36 left-0 animate-car-drive-in">
                    <Car color="#3B82F6" />
                </div>

                {/* Welcome text */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center animate-fade-in-smooth">
                        <div className="mb-6">
                            <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h1 className="text-7xl font-bold text-white drop-shadow-lg mb-3">LifeAligner</h1>
                        </div>
                        <h2 className="text-5xl font-bold text-white drop-shadow-md mb-2">Welcome{userName ? `, ${userName}` : ''}!</h2>
                        <p className="text-2xl text-white/95 drop-shadow-md">Your journey begins now</p>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/95 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slide 1: Tim
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Background skyColor="from-slate-600 via-slate-500 to-teal-300" hasSnow={false} />

                {/* Clouds */}
                <div className="absolute top-24 left-32 animate-float-cloud opacity-70">
                    <svg width="150" height="80" viewBox="0 0 150 80">
                        <ellipse cx="40" cy="50" rx="30" ry="20" fill="white" opacity="0.8" />
                        <ellipse cx="65" cy="40" rx="35" ry="25" fill="white" opacity="0.8" />
                        <ellipse cx="95" cy="45" rx="30" ry="22" fill="white" opacity="0.8" />
                    </svg>
                </div>

                {/* Parked car */}
                <div className="absolute bottom-36 left-24">
                    <Car color="#3B82F6" />
                </div>

                {/* Tim card */}
                <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
                    <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-10 max-w-4xl shadow-2xl animate-slide-up-smooth">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-blue-400/40 shadow-xl">
                                    <Image src="/illustrations/tim-collins.webp" alt="Tim Collins" fill className="object-cover" priority />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-block px-4 py-1.5 bg-blue-100 rounded-full mb-3">
                                    <span className="text-blue-700 text-sm font-bold tracking-wide">YOUR GUIDE</span>
                                </div>
                                <h2 className="text-5xl font-bold text-gray-900 mb-3">Tim Collins</h2>
                                <p className="text-xl text-gray-700 leading-relaxed mb-4">
                                    Built a <strong className="text-blue-600">$2B company</strong> using these 9 principles.
                                    Now he&apos;s sharing the roadmap.
                                </p>
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <span className="text-white font-semibold">Ready for the journey?</span>
                                    <span className="text-white text-xl">→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/95 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Landmarks 2-10
    if (currentSlide >= 2 && currentSlide <= 10) {
        const idx = currentSlide - 2;
        const landmark = landmarks[idx];

        return (
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Background skyColor={`${landmark.bgColor} to-sky-200`} />

                {/* Clouds */}
                <div className="absolute top-20 left-20 animate-float-cloud opacity-80">
                    <svg width="140" height="70" viewBox="0 0 140 70">
                        <ellipse cx="35" cy="45" rx="28" ry="18" fill="white" opacity="0.85" />
                        <ellipse cx="60" cy="35" rx="32" ry="22" fill="white" opacity="0.85" />
                        <ellipse cx="88" cy="40" rx="28" ry="20" fill="white" opacity="0.85" />
                    </svg>
                </div>

                {/* Driving car */}
                <div className="absolute bottom-36 left-1/4">
                    <div className="animate-car-bounce">
                        <Car color={landmark.color} />
                    </div>
                </div>

                {/* Landmark sign */}
                <div className="absolute bottom-40 right-1/4 z-10">
                    <div className="animate-slide-up-smooth">
                        {/* Sign post */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-44 bg-gradient-to-b from-amber-800 to-amber-950 rounded-t-md shadow-lg"></div>

                        {/* Sign board */}
                        <div className="relative bg-white/98 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-4 border-amber-700 min-w-[360px]">
                            <div className="flex items-center gap-5 mb-4">
                                {/* Icon circle */}
                                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                                    style={{ backgroundColor: `${landmark.color}20`, border: `3px solid ${landmark.color}` }}>
                                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: landmark.color }}></div>
                                </div>
                                {/* Number badge */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                                    {landmark.num}
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{landmark.title}</h3>
                            <p className="text-lg text-gray-700 leading-relaxed">{landmark.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[550px] z-20">
                    <div className="bg-white/98 backdrop-blur-sm rounded-full p-3 shadow-xl">
                        <div className="flex items-center gap-2">
                            {landmarks.map((_, i) => (
                                <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${i < idx ? 'bg-green-500 shadow-md' :
                                        i === idx ? 'bg-blue-500 shadow-lg scale-110' :
                                            'bg-gray-300'
                                    }`} />
                            ))}
                        </div>
                    </div>
                    <p className="text-center text-white text-sm font-bold mt-2 drop-shadow-lg">
                        Stop {landmark.num} of 9
                    </p>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/95 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slide 11: Arrived
    if (currentSlide === 11) {
        return (
            <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Background skyColor="from-orange-300 via-pink-300 to-purple-400" hasSnow={false} />

                {/* Sun */}
                <div className="absolute top-24 right-32 animate-pulse-glow">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="40" fill="#FBBF24" opacity="0.8" />
                        <circle cx="60" cy="60" r="30" fill="#FCD34D" />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                            <line
                                key={i}
                                x1="60"
                                y1="60"
                                x2={60 + 55 * Math.cos((angle * Math.PI) / 180)}
                                y2={60 + 55 * Math.sin((angle * Math.PI) / 180)}
                                stroke="#F59E0B"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        ))}
                    </svg>
                </div>

                {/* House */}
                <div className="absolute bottom-40 right-1/3 animate-slide-up-smooth">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                        <rect x="50" y="100" width="100" height="100" fill="#8B4513" stroke="#654321" strokeWidth="3" />
                        <polygon points="40,100 100,40 160,100" fill="#DC2626" stroke="#991B1B" strokeWidth="3" />
                        <rect x="75" y="140" width="25" height="60" fill="#422006" />
                        <rect x="115" y="120" width="30" height="30" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" />
                        <rect x="120" y="125" width="10" height="10" fill="#3B82F6" />
                        <rect x="130" y="125" width="10" height="10" fill="#3B82F6" />
                        <rect x="120" y="135" width="10" height="10" fill="#3B82F6" />
                        <rect x="130" y="135" width="10" height="10" fill="#3B82F6" />
                    </svg>
                </div>

                {/* Parked car */}
                <div className="absolute bottom-36 right-1/2 translate-x-12">
                    <Car color="#10B981" />
                </div>

                {/* Success message */}
                <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
                    <div className="text-center animate-fade-in-smooth">
                        <div className="text-8xl mb-6 animate-bounce-gentle">🎉</div>
                        <h2 className="text-7xl font-bold text-white drop-shadow-2xl mb-4">You&apos;ve Arrived!</h2>
                        <p className="text-3xl text-white/95 drop-shadow-lg mb-10">Ready to build your roadmap</p>
                        <button
                            onClick={handleComplete}
                            className="px-12 py-5 bg-white text-purple-600 rounded-2xl text-2xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
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
