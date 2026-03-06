'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DemographicsQuestionnaire from '@/app/components/DemographicsQuestionnaire';

interface WelcomeFlowProps {
    onComplete: () => void;
    userName?: string;
}

type Step = 'welcome' | 'thank-tim' | 'journey-intro' | 'demographics' | 'ready';

export default function WelcomeFlow({ onComplete, userName }: WelcomeFlowProps) {
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [fadeOut, setFadeOut] = useState(false);

    // Auto-advance welcome screen
    useEffect(() => {
        if (currentStep === 'welcome') {
            const timer = setTimeout(() => {
                fadeAndAdvance('thank-tim');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    const fadeAndAdvance = (nextStep: Step) => {
        setFadeOut(true);
        setTimeout(() => {
            setCurrentStep(nextStep);
            setFadeOut(false);
        }, 500);
    };

    const handleDemographicsComplete = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                welcome_seen: true,
                onboarding_completed: true
            }).eq('id', user.id);
        }
        fadeAndAdvance('ready');
        setTimeout(onComplete, 2000);
    };

    const handleDemographicsSkip = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                welcome_seen: true,
                onboarding_completed: true
            }).eq('id', user.id);
        }
        fadeAndAdvance('ready');
        setTimeout(onComplete, 2000);
    };

    // WELCOME SCREEN
    if (currentStep === 'welcome') {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center">
                    <div className="w-32 h-32 bg-white/95 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
                        <svg className="w-20 h-20 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                    <h1 className="text-7xl font-bold text-white drop-shadow-2xl mb-3">LifeAligner</h1>
                    <p className="text-2xl text-white/95 drop-shadow-md">Welcome{userName ? `, ${userName}` : ''}!</p>
                </div>
            </div>
        );
    }

    // THANK TIM SCREEN
    if (currentStep === 'thank-tim') {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-purple-600 to-blue-600 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="max-w-2xl mx-auto px-8 text-center">
                    <div className="text-8xl mb-8">🙏</div>
                    <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                        Thank You, Tim Collins
                    </h2>
                    <p className="text-2xl text-white/95 mb-8 drop-shadow-md leading-relaxed">
                        For creating the LifeFrame Workbook that inspired this journey to contentment
                    </p>
                    <button
                        onClick={() => fadeAndAdvance('journey-intro')}
                        className="px-12 py-4 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-2xl"
                    >
                        Begin Your Journey →
                    </button>
                </div>
            </div>
        );
    }

    // JOURNEY INTRO
    if (currentStep === 'journey-intro') {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-600 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="max-w-3xl mx-auto px-8 text-center">
                    <div className="text-8xl mb-8">🗺️</div>
                    <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                        Your Journey to Contentment
                    </h2>
                    <p className="text-2xl text-white/95 mb-4 drop-shadow-md leading-relaxed">
                        You'll discover your values, interests, and purpose,
                    </p>
                    <p className="text-2xl text-white/95 mb-8 drop-shadow-md leading-relaxed">
                        then build a personalized roadmap for a fulfilling life.
                    </p>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
                        <div className="grid grid-cols-3 gap-6 text-white">
                            <div>
                                <div className="text-5xl mb-3">💎</div>
                                <p className="font-semibold text-lg">9 Core Values</p>
                            </div>
                            <div>
                                <div className="text-5xl mb-3">🎯</div>
                                <p className="font-semibold text-lg">Life Categories</p>
                            </div>
                            <div>
                                <div className="text-5xl mb-3">🚀</div>
                                <p className="font-semibold text-lg">Action Roadmap</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-lg text-white/90 mb-8">
                        First, help us understand our community better...
                    </p>

                    <button
                        onClick={() => setCurrentStep('demographics')}
                        className="px-12 py-4 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-2xl"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        );
    }

    // DEMOGRAPHICS
    if (currentStep === 'demographics') {
        return (
            <DemographicsQuestionnaire
                onComplete={handleDemographicsComplete}
                onSkip={handleDemographicsSkip}
            />
        );
    }

    // READY TO BEGIN
    if (currentStep === 'ready') {
        return (
            <div className={`fixed inset-0 bg-gradient-to-br from-green-500 to-blue-500 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center">
                    <div className="text-9xl mb-8 animate-bounce">🎉</div>
                    <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
                        You're All Set!
                    </h2>
                    <p className="text-3xl text-white/95 drop-shadow-md">
                        Let's begin your journey...
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
