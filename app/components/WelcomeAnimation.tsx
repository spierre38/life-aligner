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
        { num: 1, title: 'Positivity', desc: 'Start with gratitude and optimism', color: '#F59E0B' },
        { num: 2, title: 'Define Success', desc: 'Choose your own path', color: '#3B82F6' },
        { num: 3, title: 'Continuous Improvement', desc: 'Climb higher every day', color: '#10B981' },
        { num: 4, title: 'Doing Good', desc: 'Leave kindness behind', color: '#14B8A6' },
        { num: 5, title: 'Open-Mindedness', desc: 'Explore new perspectives', color: '#8B5CF6' },
        { num: 6, title: 'Being Your Word', desc: 'Stay true to yourself', color: '#6366F1' },
        { num: 7, title: 'Minimize Regrets', desc: 'Take action with purpose', color: '#EF4444' },
        { num: 8, title: 'Embrace Change', desc: 'Adapt and grow', color: '#06B6D4' },
        { num: 9, title: 'Generosity', desc: 'Share with others', color: '#EC4899' }
    ];

    useEffect(() => {
        // Welcome(2s), Tim(3s), Map(3s), 9 traits(2.5s each), Final(3s) = 33.5s total
        const timings = [2000, 3000, 3000, ...Array(9).fill(2500), 3000];
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

    // SLIDE 0: Welcome
    if (currentSlide === 0) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-center animate-fade-in">
                    <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                    <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-2xl">LifeAligner</h1>
                    <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Welcome{userName ? `, ${userName}` : ''}!</h2>
                    <p className="text-2xl text-white/95 drop-shadow-md">Your journey begins now</p>
                </div>
                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all">
                    Skip →
                </button>
            </div>
        );
    }

    // SLIDE 1: Thank Tim
    if (currentSlide === 1) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-white rounded-3xl p-12 max-w-4xl shadow-2xl animate-scale-in">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0">
                            <div className="relative w-52 h-52 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-blue-400/30">
                                <Image src="/illustrations/tim-collins.webp" alt="Tim Collins" fill className="object-cover" priority />
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-4 py-1.5 bg-blue-100 rounded-full mb-4">
                                <span className="text-blue-700 text-sm font-bold uppercase tracking-wide">Your Guide</span>
                            </div>
                            <h2 className="text-5xl font-bold text-gray-900 mb-4">Tim Collins</h2>
                            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                                Built a <strong className="text-blue-600">$2B company</strong> using these 9 principles.<br />
                                Now he&apos;s sharing the complete roadmap with you.
                            </p>
                            <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <p className="text-white font-semibold">Let&apos;s begin your journey →</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all">
                    Skip →
                </button>
            </div>
        );
    }

    // SLIDE 2: Journey Map - showing all 9 stops
    if (currentSlide === 2) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-sky-400 via-blue-300 to-cyan-200 z-50 overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full max-w-6xl h-full max-h-[700px] bg-white/95 rounded-3xl shadow-2xl p-8 animate-scale-in">
                        <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">Your Journey to Success</h2>

                        {/* Journey Map - Winding Road with numbered stops */}
                        <div className="relative w-full h-full">
                            <svg viewBox="0 0 800 500" className="w-full h-full">
                                {/* Winding road path */}
                                <path
                                    d="M 50,450 Q 150,400 200,350 T 350,250 T 500,200 T 650,150 T 750,50"
                                    stroke="#94A3B8"
                                    strokeWidth="40"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 50,450 Q 150,400 200,350 T 350,250 T 500,200 T 650,150 T 750,50"
                                    stroke="#E2E8F0"
                                    strokeWidth="30"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="20 15"
                                />

                                {/* Numbered stops along the path */}
                                {[
                                    { x: 50, y: 450, num: 'START' },
                                    { x: 170, y: 370, num: 1 },
                                    { x: 260, y: 300, num: 2 },
                                    { x: 350, y: 250, num: 3 },
                                    { x: 440, y: 230, num: 4 },
                                    { x: 520, y: 200, num: 5 },
                                    { x: 600, y: 175, num: 6 },
                                    { x: 670, y: 140, num: 7 },
                                    { x: 720, y: 90, num: 8 },
                                    { x: 750, y: 50, num: 9 }
                                ].map((stop, i) => (
                                    <g key={i}>
                                        <circle
                                            cx={stop.x}
                                            cy={stop.y}
                                            r={stop.num === 'START' ? 25 : 20}
                                            fill={stop.num === 'START' ? '#10B981' : traits[Number(stop.num) - 1]?.color || '#3B82F6'}
                                            stroke="white"
                                            strokeWidth="4"
                                        />
                                        <text
                                            x={stop.x}
                                            y={stop.y + (stop.num === 'START' ? 6 : 7)}
                                            textAnchor="middle"
                                            fill="white"
                                            fontSize={stop.num === 'START' ? '10' : '16'}
                                            fontWeight="bold"
                                        >
                                            {stop.num}
                                        </text>
                                        {stop.num !== 'START' && (
                                            <text
                                                x={stop.x}
                                                y={stop.y - 30}
                                                textAnchor="middle"
                                                fill="#1F2937"
                                                fontSize="11"
                                                fontWeight="600"
                                            >
                                                {traits[Number(stop.num) - 1]?.title.split(' ')[0]}
                                            </text>
                                        )}
                                    </g>
                                ))}

                                {/* Finish flag */}
                                <g transform="translate(750, 20)">
                                    <rect x="-3" y="0" width="6" height="40" fill="#64748B" />
                                    <path d="M 3,5 L 25,10 L 3,15 Z" fill="#EF4444" />
                                </g>

                                {/* Car at start */}
                                <g transform="translate(30, 430)">
                                    <rect x="0" y="5" width="35" height="15" rx="3" fill="#3B82F6" />
                                    <circle cx="8" cy="20" r="4" fill="#1F2937" />
                                    <circle cx="27" cy="20" r="4" fill="#1F2937" />
                                </g>
                            </svg>
                        </div>

                        <p className="text-center text-gray-600 text-lg mt-4">Follow the path through 9 transformative traits</p>
                    </div>
                </div>
                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all z-10">
                    Skip →
                </button>
            </div>
        );
    }

    // SLIDES 3-11: Individual Traits with illustrated monuments
    if (currentSlide >= 3 && currentSlide <= 11) {
        const traitIndex = currentSlide - 3;
        const trait = traits[traitIndex];

        return (
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ background: `linear-gradient(to bottom right, ${trait.color}dd, ${trait.color}99)` }}>
                {/* Mountains background */}
                <div className="absolute bottom-0 left-0 right-0 h-64 opacity-20">
                    <svg viewBox="0 0 1200 300" className="w-full h-full">
                        <path d="M0,300 L0,150 Q300,100 600,80 T1200,120 L1200,300 Z" fill="currentColor" />
                    </svg>
                </div>

                {/* Monument/Statue illustration */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-monument-rise">
                    <svg width="200" height="250" viewBox="0 0 200 250">
                        {/* Pedestal */}
                        <rect x="50" y="200" width="100" height="50" fill="#78716C" stroke="#57534E" strokeWidth="2" />
                        <rect x="45" y="190" width="110" height="15" fill="#A8A29E" stroke="#78716C" strokeWidth="2" />

                        {/* Monument shape varies by trait */}
                        {traitIndex % 3 === 0 && (
                            <>
                                <path d="M 100,50 L 120,190 L 80,190 Z" fill="#D4D4D8" stroke="#A1A1AA" strokeWidth="2" />
                                <circle cx="100" cy="40" r="15" fill={trait.color} stroke="white" strokeWidth="3" />
                            </>
                        )}
                        {traitIndex % 3 === 1 && (
                            <>
                                <rect x="85" y="80" width="30" height="110" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="2" />
                                <rect x="80" y="70" width="40" height="15" fill="#D4D4D8" />
                                <circle cx="100" cy="50" r="20" fill={trait.color} stroke="white" strokeWidth="3" />
                            </>
                        )}
                        {traitIndex % 3 === 2 && (
                            <>
                                <rect x="90" y="120" width="20" height="70" fill="#D4D4D8" stroke="#A1A1AA" strokeWidth="2" />
                                <ellipse cx="100" cy="110" rx="20" ry="25" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="2" />
                                <circle cx="100" cy="85" r="18" fill={trait.color} stroke="white" strokeWidth="3" />
                            </>
                        )}

                        {/* Number badge */}
                        <circle cx="100" cy="220" r="20" fill="white" stroke={trait.color} strokeWidth="3" />
                        <text x="100" y="228" textAnchor="middle" fill={trait.color} fontSize="20" fontWeight="bold">{trait.num}</text>
                    </svg>
                </div>

                {/* Car in scene */}
                <div className="absolute bottom-24 left-1/4">
                    <svg width="80" height="40" viewBox="0 0 80 40">
                        <rect x="10" y="15" width="60" height="15" rx="3" fill="#3B82F6" />
                        <circle cx="20" cy="30" r="5" fill="#1F2937" />
                        <circle cx="60" cy="30" r="5" fill="#1F2937" />
                        <rect x="15" y="10" width="20" height="8" rx="2" fill="#60A5FA" />
                    </svg>
                </div>

                {/* Trait info card */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8">
                    <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-10 shadow-2xl animate-slide-down">
                        <div className="text-center">
                            <div className="inline-block px-5 py-2 bg-gray-100 rounded-full mb-4">
                                <span className="text-gray-700 text-sm font-bold">Trait {trait.num} of 9</span>
                            </div>
                            <h2 className="text-5xl font-bold text-gray-900 mb-4">{trait.title}</h2>
                            <p className="text-2xl text-gray-700 leading-relaxed">{trait.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {traits.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i < traitIndex ? 'w-8 bg-green-500' :
                                    i === traitIndex ? 'w-12 bg-white shadow-lg' :
                                        'w-8 bg-white/40'
                                }`}
                        />
                    ))}
                </div>

                <button onClick={handleComplete} className="absolute top-6 right-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all">
                    Skip →
                </button>
            </div>
        );
    }

    // SLIDE 12: Final - Let's Begin
    if (currentSlide === 12) {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-center animate-fade-in">
                    <div className="text-9xl mb-8 animate-bounce-slow">🎉</div>
                    <h2 className="text-7xl font-bold text-white mb-6 drop-shadow-2xl">You&apos;re Ready!</h2>
                    <p className="text-3xl text-white/95 mb-12 drop-shadow-lg">Let&apos;s build your personalized roadmap</p>
                    <button
                        onClick={handleComplete}
                        className="px-14 py-6 bg-white text-teal-600 rounded-2xl text-2xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                    >
                        Start My Workbook →
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
