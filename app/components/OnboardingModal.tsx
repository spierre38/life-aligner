'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type OnboardingStep = {
    title: string;
    description: string;
    details?: string;
    illustration: JSX.Element;
    action?: {
        label: string;
        href: string;
    };
};

type OnboardingModalProps = {
    userId: string;
    onComplete: () => void;
};

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [show, setShow] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);

    useEffect(() => {
        checkIfShouldShow();
    }, [userId]);

    const checkIfShouldShow = async () => {
        try {
            // Check if user has completed onboarding
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', userId)
                .single();

            // Check if user has any worksheet entries
            const { data: entries } = await supabase
                .from('workbook_entries')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            // Show onboarding if new user (no entries yet) and hasn't completed onboarding
            if ((!entries || entries.length === 0) && !profile?.onboarding_completed) {
                setShow(true);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        }
    };

    const steps: OnboardingStep[] = [
        {
            title: 'Welcome to Your Guided Tour',
            description: 'This quick walkthrough will show you exactly how LifeAligner works — so you can hit the ground running.',
            details: 'You\'ll complete a 3-part workbook (Values → Interests → Life Categories), then build a personalized Roadmap with goals and daily actions. Let\'s see how it all fits together.',
            illustration: (
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
            ),
        },
        {
            title: 'Part 1: Define Your Values',
            description: 'Values are the principles that guide every decision you make — like a compass for your life.',
            details: 'You\'ll choose from 20 core values (like Authenticity, Compassion, and Courage), then rank them in order of importance. This takes about 15-30 minutes and forms the foundation of everything that follows.',
            illustration: (
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
                    <rect x="40" y="40" width="120" height="120" rx="12" fill="#E0E7FF" stroke="#6366F1" strokeWidth="3" />
                    <circle cx="100" cy="80" r="15" fill="#6366F1" />
                    <rect x="70" y="110" width="60" height="8" rx="4" fill="#6366F1" />
                    <rect x="70" y="130" width="40" height="8" rx="4" fill="#A78BFA" />
                    <rect x="70" y="150" width="50" height="8" rx="4" fill="#A78BFA" />
                </svg>
            ),
            action: {
                label: 'Start with Values',
                href: '/workbook/values'
            }
        },
        {
            title: 'Part 2: Discover Your Interests',
            description: 'Interests are the activities that bring you joy and energy — the things that light you up.',
            details: 'You\'ll select 5 things you already enjoy and 5 new things you want to explore. The "sweet spot" is where your interests combine joy, creativity, and helping others.',
            illustration: (
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="70" fill="#FDE68A" opacity="0.3" />
                    <circle cx="100" cy="100" r="20" fill="#F59E0B" opacity="0.8" />
                    <circle cx="100" cy="40" r="12" fill="#f093fb" />
                    <circle cx="150" cy="70" r="12" fill="#ff6b9d" />
                    <circle cx="150" cy="130" r="12" fill="#f5576c" />
                    <circle cx="100" cy="160" r="12" fill="#ff6b9d" />
                    <circle cx="50" cy="130" r="12" fill="#f093fb" />
                    <circle cx="50" cy="70" r="12" fill="#f5576c" />
                    <line x1="100" y1="80" x2="100" y2="52" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                    <line x1="120" y1="100" x2="138" y2="77" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                    <line x1="120" y1="100" x2="138" y2="123" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                    <line x1="100" y1="120" x2="100" y2="148" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                    <line x1="80" y1="100" x2="62" y2="123" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                    <line x1="80" y1="100" x2="62" y2="77" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />
                </svg>
            ),
            action: {
                label: 'Explore Interests',
                href: '/workbook/interests'
            }
        },
        {
            title: 'Part 3: Life Categories & Purpose',
            description: 'Life Categories are the areas of your life you want to focus on — like Health, Relationships, Career, and Spirituality.',
            details: 'You\'ll pick 3-8 categories and define sub-categories within each one. Then, you\'ll define your Purpose: the long-term, meaningful impact you want to have on others.',
            illustration: (
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
                    <path d="M 100,100 L 100,30 A 70,70 0 0,1 161,61 Z" fill="#667eea" opacity="0.7" />
                    <path d="M 100,100 L 161,61 A 70,70 0 0,1 161,139 Z" fill="#764ba2" opacity="0.7" />
                    <path d="M 100,100 L 161,139 A 70,70 0 0,1 100,170 Z" fill="#f093fb" opacity="0.7" />
                    <path d="M 100,100 L 100,170 A 70,70 0 0,1 39,139 Z" fill="#667eea" opacity="0.7" />
                    <path d="M 100,100 L 39,139 A 70,70 0 0,1 39,61 Z" fill="#764ba2" opacity="0.7" />
                    <path d="M 100,100 L 39,61 A 70,70 0 0,1 100,30 Z" fill="#f093fb" opacity="0.7" />
                    <circle cx="100" cy="100" r="25" fill="white" />
                    <circle cx="100" cy="100" r="18" fill="#667eea" opacity="0.5" />
                </svg>
            ),
            action: {
                label: 'Set Up Life Categories',
                href: '/workbook/life-categories'
            }
        },
        {
            title: 'Then: Build Your Roadmap',
            description: 'Once your LifeFrame (Values + Interests + Categories) is complete, you\'ll create a Roadmap with concrete goals and daily activities.',
            details: 'Set goals for each Life Category, break them into daily activities, and track your progress. You can also use the To-Do List to stay accountability every single day.',
            illustration: (
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
                    <path d="M30 170 Q70 120, 100 120 T170 40" stroke="#6366F1" strokeWidth="4" strokeDasharray="8 8" fill="none" />
                    <circle cx="30" cy="170" r="10" fill="#10B981" stroke="white" strokeWidth="3" />
                    <circle cx="100" cy="120" r="8" fill="#A78BFA" stroke="white" strokeWidth="2" />
                    <circle cx="140" cy="80" r="8" fill="#A78BFA" stroke="white" strokeWidth="2" />
                    <path d="M170 40 L174 48 L183 49 L176 56 L178 65 L170 60 L162 65 L164 56 L157 49 L166 48 Z" fill="#FCD34D" />
                </svg>
            ),
            action: {
                label: 'View Roadmap',
                href: '/roadmap'
            }
        },
        {
            title: 'You\'re Ready to Begin!',
            description: 'Start with Step 1: Values. Each section has a short video, examples, and a guided worksheet. Take your time — this is about you.',
            details: 'Remember: Contentment is a journey, not a destination. You can always update and refine your LifeFrame and Roadmap as you grow.',
            illustration: (
                <div className="w-32 h-32 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse opacity-20"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            ),
        },
    ];

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        setShowSkipConfirm(true);
    };

    const confirmSkip = () => {
        setShowSkipConfirm(false);
        handleComplete();
    };

    const cancelSkip = () => {
        setShowSkipConfirm(false);
    };

    const handleComplete = async () => {
        // Mark onboarding as completed
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', userId);
        } catch (error) {
            console.error('Error marking onboarding complete:', error);
        }

        setShow(false);
        onComplete();
    };

    const handleActionClick = () => {
        if (currentStepData.action) {
            router.push(currentStepData.action.href);
            handleComplete();
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 md:p-12">
                    {/* Step indicator */}
                    <div className="text-center mb-6">
                        <span className="text-sm font-semibold text-indigo-600">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </div>

                    {/* Illustration */}
                    <div className="mb-8">
                        {currentStepData.illustration}
                    </div>

                    {/* Title & Description */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            {currentStepData.title}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-md mx-auto">
                            {currentStepData.description}
                        </p>
                        {currentStepData.details && (
                            <p className="text-sm text-gray-500 max-w-md mx-auto mt-3 leading-relaxed">
                                {currentStepData.details}
                            </p>
                        )}
                    </div>

                    {/* Action Button (if available) */}
                    {currentStepData.action && (
                        <div className="mb-6">
                            <button
                                onClick={handleActionClick}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
                            >
                                {currentStepData.action.label} →
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-4">
                        {!isLastStep && (
                            <button
                                onClick={handleSkip}
                                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                            >
                                Skip Tour
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className={`
                flex-1 py-3 rounded-xl font-semibold transition-all
                ${isLastStep
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }
              `}
                        >
                            {isLastStep ? 'Get Started!' : 'Next'}
                        </button>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`
                  w-2 h-2 rounded-full transition-all
                  ${index === currentStep
                                        ? 'bg-indigo-600 w-8'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }
                `}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Skip Confirmation Overlay */}
            {showSkipConfirm && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Skip the Tutorial?</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            Are you sure? This walkthrough helps you understand how LifeAligner works. You can always restart it from Settings.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={cancelSkip}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                            >
                                Keep Going
                            </button>
                            <button
                                onClick={confirmSkip}
                                className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition"
                            >
                                Yes, Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact tooltip-style tutorial for individual features
type FeatureTipProps = {
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    onClose: () => void;
};

export function FeatureTip({ title, description, position = 'bottom', onClose }: FeatureTipProps) {
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div className={`absolute ${positionClasses[position]} z-50 animate-fade-in`}>
            <div className="bg-indigo-600 text-white rounded-xl shadow-2xl p-4 max-w-xs">
                <div className="flex items-start gap-3">
                    <div className="flex-1">
                        <h4 className="font-bold mb-1">{title}</h4>
                        <p className="text-sm text-indigo-100">{description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            {/* Arrow pointer */}
            <div
                className={`
          absolute w-0 h-0 border-8 border-transparent
          ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-indigo-600' : ''}
          ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-indigo-600' : ''}
          ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 border-r-indigo-600' : ''}
          ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-indigo-600' : ''}
        `}
            />
        </div>
    );
}
