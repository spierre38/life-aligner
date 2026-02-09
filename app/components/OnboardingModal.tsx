'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type OnboardingStep = {
    title: string;
    description: string;
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
            title: 'Welcome to LifeAligner! 🎉',
            description: 'Your personal tool for defining and achieving contentment through intentional goal-setting.',
            illustration: (
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
            ),
        },
        {
            title: 'Step 1: Build Your LifeFrame',
            description: 'First, define what matters most: your Values, Interests, and Life Categories (including your Purpose).',
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
            title: 'Step 2: Create Your Roadmap',
            description: 'Once your LifeFrame is complete, set Goals and Activities for each Life Category.',
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
                label: 'View Roadmap Guide',
                href: '/dashboard'
            }
        },
        {
            title: 'Step 3: Take Action with To-Do List',
            description: 'Turn your Roadmap activities into daily tasks. Track progress and stay motivated!',
            illustration: (
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
                    <rect x="50" y="30" width="100" height="140" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
                    <rect x="70" y="60" width="20" height="20" rx="4" fill="#10B981" />
                    <path d="M74 70 L78 74 L86 66" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="100" y1="70" x2="130" y2="70" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                    <rect x="70" y="90" width="20" height="20" rx="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
                    <line x1="100" y1="100" x2="130" y2="100" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                    <rect x="70" y="120" width="20" height="20" rx="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
                    <line x1="100" y1="130" x2="130" y2="130" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            action: {
                label: 'Explore To-Do List',
                href: '/todo'
            }
        },
        {
            title: 'You\'re All Set! 🚀',
            description: 'Remember: Contentment is a journey, not a destination. Update your LifeFrame and Roadmap regularly as you grow!',
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
        handleComplete();
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
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {currentStepData.title}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-md mx-auto">
                            {currentStepData.description}
                        </p>
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
