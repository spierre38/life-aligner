'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type WelcomeAnimationProps = {
    onComplete: () => void;
    userName?: string;
};

// SVG Components
const CarSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="car-body">
            {/* Car body */}
            <path d="M40 60 L50 40 L90 40 L100 50 L160 50 L160 70 L40 70 Z" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2" />
            {/* Windows */}
            <path d="M55 45 L75 45 L80 50 L55 50 Z" fill="#60A5FA" opacity="0.7" />
            <path d="M95 50 L145 50 L145 55 L95 55 Z" fill="#60A5FA" opacity="0.7" />
            {/* Wheels */}
            <circle cx="60" cy="70" r="12" fill="#1F2937" stroke="#374151" strokeWidth="2" />
            <circle cx="60" cy="70" r="6" fill="#6B7280" />
            <circle cx="140" cy="70" r="12" fill="#1F2937" stroke="#374151" strokeWidth="2" />
            <circle cx="140" cy="70" r="6" fill="#6B7280" />
            {/* Headlights */}
            <circle cx="155" cy="60" r="3" fill="#FCD34D" className="animate-pulse" />
            {/* Details */}
            <line x1="90" y1="50" x2="90" y2="70" stroke="#1E40AF" strokeWidth="2" />
        </g>
    </svg>
);

const MountainSVG = ({ className = "", opacity = "0.3" }: { className?: string; opacity?: string }) => (
    <svg className={className} viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 300 L0 150 L200 100 L400 180 L600 80 L800 160 L1000 120 L1200 200 L1200 300 Z"
            fill="currentColor"
            opacity={opacity} />
        <path d="M0 300 L100 200 L300 220 L500 140 L700 200 L900 160 L1100 220 L1200 180 L1200 300 Z"
            fill="currentColor"
            opacity={String(parseFloat(opacity) * 0.7)} />
    </svg>
);

const TreeSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Trunk */}
        <rect x="20" y="50" width="10" height="30" fill="#78350F" rx="2" />
        {/* Foliage layers */}
        <path d="M25 50 L15 35 L10 35 L25 10 L40 35 L35 35 Z" fill="#166534" />
        <path d="M25 40 L17 28 L13 28 L25 8 L37 28 L33 28 Z" fill="#15803D" />
        <path d="M25 30 L19 20 L16 20 L25 5 L34 20 L31 20 Z" fill="#16A34A" />
    </svg>
);

const CloudSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="60" rx="30" ry="20" fill="white" opacity="0.9" />
        <ellipse cx="80" cy="50" rx="40" ry="30" fill="white" opacity="0.9" />
        <ellipse cx="120" cy="55" rx="35" ry="25" fill="white" opacity="0.9" />
        <ellipse cx="150" cy="65" rx="25" ry="18" fill="white" opacity="0.9" />
    </svg>
);

const RoadSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 1200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Road surface */}
        <path d="M0 100 L0 150 L1200 150 L1200 80 Z" fill="#374151" />
        <path d="M0 100 L0 110 L1200 90 L1200 80 Z" fill="#4B5563" />
        {/* Center line */}
        <g className="road-lines">
            {[0, 150, 300, 450, 600, 750, 900, 1050].map((x, i) => (
                <rect key={i} x={x} y="110" width="80" height="4" fill="#FCD34D" opacity="0.8" />
            ))}
        </g>
    </svg>
);

// Trait Icons as SVG
const traitIcons = {
    positivity: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#FCD34D" stroke="#F59E0B" strokeWidth="3" />
            <path d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z" fill="#F59E0B" />
            <circle cx="50" cy="50" r="15" fill="#FBBF24" />
        </svg>
    ),
    success: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="#3B82F6" strokeWidth="4" fill="#DBEAFE" />
            <path d="M50 25 L50 50 L70 40" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="50" r="8" fill="#3B82F6" />
        </svg>
    ),
    improvement: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 80 L35 60 L50 70 L65 40 L80 50" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M65 40 L80 50 L80 35" fill="#10B981" />
            <circle cx="20" cy="80" r="5" fill="#059669" />
            <circle cx="35" cy="60" r="5" fill="#10B981" />
            <circle cx="50" cy="70" r="5" fill="#34D399" />
            <circle cx="65" cy="40" r="5" fill="#6EE7B7" />
            <circle cx="80" cy="50" r="5" fill="#A7F3D0" />
        </svg>
    ),
    goodness: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 30 C30 30 20 40 20 55 C20 70 35 80 50 90 C65 80 80 70 80 55 C80 40 70 30 50 30 Z"
                fill="#10B981" stroke="#059669" strokeWidth="3" />
            <path d="M40 50 L47 57 L62 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
    ),
    openmind: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="45" r="25" fill="#A855F7" stroke="#7C3AED" strokeWidth="3" />
            <path d="M35 45 Q40 30 50 30 Q60 30 65 45" stroke="#E9D5FF" strokeWidth="2" fill="none" />
            <path d="M40 50 Q50 55 60 50" stroke="#E9D5FF" strokeWidth="2" fill="none" />
            <circle cx="42" cy="42" r="4" fill="#F3E8FF" />
            <circle cx="58" cy="42" r="4" fill="#F3E8FF" />
            <path d="M30 70 L50 80 L70 70" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
    ),
    integrity: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="30" width="40" height="40" rx="5" fill="#6366F1" stroke="#4F46E5" strokeWidth="3" />
            <path d="M40 50 L47 57 L60 44" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="50" r="28" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        </svg>
    ),
    action: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 50 L50 30 L50 45 L70 45 L70 55 L50 55 L50 70 Z" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
            <circle cx="50" cy="50" r="35" stroke="#FB923C" strokeWidth="2" strokeDasharray="5 5" fill="none" />
        </svg>
    ),
    change: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 20 Q70 30 70 50 Q70 70 50 80" stroke="#06B6D4" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M50 80 Q30 70 30 50 Q30 30 50 20" stroke="#0891B2" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M50 20 L55 30 L45 30 Z" fill="#06B6D4" />
            <path d="M50 80 L45 70 L55 70 Z" fill="#0891B2" />
        </svg>
    ),
    generosity: (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 30 C40 30 35 35 35 42 C35 50 42 55 50 62 C58 55 65 50 65 42 C65 35 60 30 50 30 Z"
                fill="#EC4899" stroke="#DB2777" strokeWidth="2" />
            <circle cx="35" cy="55" r="8" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2" />
            <circle cx="65" cy="55" r="8" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2" />
            <circle cx="50" cy="70" r="8" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2" />
        </svg>
    ),
};

const landmarks = [
    { num: 1, title: 'Positivity', desc: 'Start with gratitude', icon: 'positivity', gradient: 'from-yellow-400 to-orange-500' },
    { num: 2, title: 'Define Success', desc: 'Choose your path', icon: 'success', gradient: 'from-blue-500 to-purple-600' },
    { num: 3, title: 'Improvement', desc: 'Climb higher daily', icon: 'improvement', gradient: 'from-green-500 to-emerald-600' },
    { num: 4, title: 'Doing Good', desc: 'Leave kindness behind', icon: 'goodness', gradient: 'from-emerald-500 to-teal-600' },
    { num: 5, title: 'Open Mind', desc: 'Explore perspectives', icon: 'openmind', gradient: 'from-purple-500 to-pink-600' },
    { num: 6, title: 'Integrity', desc: 'Stay true', icon: 'integrity', gradient: 'from-indigo-500 to-blue-600' },
    { num: 7, title: 'Take Action', desc: 'Drive forward', icon: 'action', gradient: 'from-orange-500 to-red-600' },
    { num: 8, title: 'Embrace Change', desc: 'Adapt to terrain', icon: 'change', gradient: 'from-cyan-500 to-blue-600' },
    { num: 9, title: 'Generosity', desc: 'Share the journey', icon: 'generosity', gradient: 'from-pink-500 to-rose-600' }
];

export default function WelcomeAnimation({ onComplete, userName }: WelcomeAnimationProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

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

    // Slide 0: Welcome
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-sky-400 via-blue-300 to-emerald-200 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* Clouds */}
                <CloudSVG className="absolute top-20 left-20 w-64 animate-float-slow opacity-90" />
                <CloudSVG className="absolute top-32 right-32 w-80 animate-float-slower opacity-80" />
                <CloudSVG className="absolute top-48 left-1/2 w-48 animate-float opacity-70" />

                {/* Mountains */}
                <div className="absolute bottom-0 left-0 right-0 text-slate-700">
                    <MountainSVG opacity="0.25" />
                </div>

                {/* Trees */}
                <div className="absolute bottom-24 left-0 right-0 flex justify-around items-end opacity-70">
                    <TreeSVG className="w-16 h-24" />
                    <TreeSVG className="w-20 h-32" />
                    <TreeSVG className="w-14 h-20" />
                    <TreeSVG className="w-24 h-36" />
                    <TreeSVG className="w-16 h-24" />
                </div>

                {/* Road */}
                <div className="absolute bottom-0 left-0 right-0">
                    <RoadSVG className="w-full animate-road-scroll-slow" />
                </div>

                {/* Car entering */}
                <div className="absolute bottom-32 left-0 animate-car-enter">
                    <CarSVG className="w-48 h-24" />
                </div>

                {/* Welcome Text */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center animate-fade-in-up">
                        <div className="mb-8">
                            <div className="w-28 h-28 bg-white/95 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-2xl">LifeAligner</h1>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Welcome{userName ? `, ${userName}` : ''}!</h2>
                        <p className="text-2xl text-white/95 drop-shadow-lg">Your journey begins...</p>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-blue-600 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Slide 1: Tim
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-slate-700 via-slate-600 to-emerald-300 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <CloudSVG className="absolute top-24 left-32 w-56 animate-float-slow opacity-60" />
                <CloudSVG className="absolute top-32 right-40 w-64 animate-float-slower opacity-50" />

                <div className="absolute bottom-0 left-0 right-0 text-slate-800">
                    <MountainSVG opacity="0.3" />
                </div>

                <div className="absolute bottom-24 left-0 right-0 flex justify-around opacity-60">
                    <TreeSVG className="w-16 h-24" />
                    <TreeSVG className="w-20 h-32" />
                    <TreeSVG className="w-16 h-24" />
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <RoadSVG className="w-full" />
                </div>

                <div className="absolute bottom-32 left-24">
                    <CarSVG className="w-48 h-24" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 max-w-4xl shadow-2xl animate-scale-in">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-blue-500/30 shadow-xl">
                                    <Image src="/illustrations/tim-collins.webp" alt="Tim Collins" fill className="object-cover" priority />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-block px-4 py-1 bg-blue-100 rounded-full mb-3">
                                    <span className="text-blue-600 text-sm font-bold">Your Guide</span>
                                </div>
                                <h2 className="text-5xl font-bold text-gray-900 mb-3">Tim Collins</h2>
                                <p className="text-xl text-gray-700 mb-4 leading-relaxed">
                                    Built a <strong>$2B company</strong> using these 9 principles. Now sharing the roadmap.
                                </p>
                                <div className="inline-block px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                                    <p className="text-white text-sm font-semibold">Ready to drive? →</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Landmarks
    if (currentSlide >= 2 && currentSlide <= 10) {
        const idx = currentSlide - 2;
        const landmark = landmarks[idx];
        const Icon = traitIcons[landmark.icon as keyof typeof traitIcons];

        return (
            <div className={`fixed inset-0 bg-gradient-to-b ${landmark.gradient} z-50 overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <CloudSVG className="absolute top-16 left-24 w-56 animate-float-slow opacity-70" />
                <CloudSVG className="absolute top-28 right-32 w-64 animate-float-slower opacity-60" />

                <div className="absolute bottom-0 left-0 right-0 text-black">
                    <MountainSVG opacity="0.2" />
                </div>

                <div className="absolute bottom-28 left-0 right-0 flex gap-20 animate-slide-trees">
                    {[...Array(15)].map((_, i) => (
                        <TreeSVG key={i} className="w-16 h-24 flex-shrink-0 opacity-60" />
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <RoadSVG className="w-full animate-road-scroll" />
                </div>

                <div className="absolute bottom-32 left-1/4">
                    <CarSVG className="w-48 h-24 animate-car-bounce" />
                </div>

                {/* Landmark Sign */}
                <div className="absolute bottom-36 right-1/4 animate-scale-in z-10">
                    <div className="relative">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-40 bg-gradient-to-b from-amber-900 to-amber-950 rounded-t"></div>

                        <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-amber-800 min-w-[340px]">
                            <div className="flex items-center gap-5 mb-4">
                                <div className="w-20 h-20 flex-shrink-0">
                                    {Icon}
                                </div>
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {landmark.num}
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">{landmark.title}</h3>
                            <p className="text-lg text-gray-700">{landmark.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[500px] z-20">
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-full p-3 shadow-xl">
                        {landmarks.map((_, i) => (
                            <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${i < idx ? 'bg-green-500' : i === idx ? 'bg-blue-500 shadow-lg' : 'bg-gray-300'
                                }`} />
                        ))}
                    </div>
                    <p className="text-center text-white text-sm mt-2 drop-shadow-lg font-bold">Stop {landmark.num} of 9</p>
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl transition-all text-sm font-bold shadow-xl hover:scale-105 z-20">
                    Skip Journey →
                </button>
            </div>
        );
    }

    // Final: Arrived
    if (currentSlide === 11) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-b from-orange-400 via-pink-400 to-purple-500 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-24 right-32 text-9xl animate-pulse-slow drop-shadow-2xl">☀️</div>

                <div className="absolute bottom-0 left-0 right-0 text-black">
                    <MountainSVG opacity="0.25" />
                </div>

                <svg className="absolute bottom-36 right-1/3 w-64 h-64 animate-scale-in" viewBox="0 0 200 200">
                    <rect x="60" y="100" width="80" height="80" fill="#8B4513" stroke="#654321" strokeWidth="3" />
                    <polygon points="50,100 100,50 150,100" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="3" />
                    <rect x="80" y="140" width="20" height="40" fill="#422006" />
                    <rect x="110" y="120" width="25" height="25" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" />
                </svg>

                <div className="absolute bottom-32 right-1/2">
                    <CarSVG className="w-48 h-24" />
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <RoadSVG className="w-full" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
                    <div className="text-center animate-fade-in-up">
                        <div className="text-9xl mb-6 animate-bounce-in drop-shadow-2xl">🎉</div>
                        <h2 className="text-7xl font-bold text-white mb-4 drop-shadow-2xl">You&apos;ve Arrived!</h2>
                        <p className="text-3xl text-white/95 mb-10 drop-shadow-lg">Ready to build your roadmap</p>
                        <button onClick={handleComplete} className="px-12 py-5 bg-white text-purple-600 rounded-2xl text-2xl font-bold shadow-2xl hover:scale-105 transition-transform">
                            Start My Workbook →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
