'use client';

import { useState } from 'react';

// ============================================================================
// INLINE SVG ICONS
// ============================================================================

const ValuesIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="valuesIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
        </defs>
        {/* Compass/values representation */}
        <circle cx="100" cy="100" r="60" fill="url(#valuesIconGradient)" opacity="0.1" />
        <line x1="100" y1="50" x2="100" y2="70" stroke="url(#valuesIconGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="130" x2="100" y2="150" stroke="url(#valuesIconGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="100" x2="70" y2="100" stroke="url(#valuesIconGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="130" y1="100" x2="150" y2="100" stroke="url(#valuesIconGradient)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="25" fill="url(#valuesIconGradient)" opacity="0.8" />
        <circle cx="100" cy="100" r="15" fill="white" />
        <circle cx="100" cy="60" r="8" fill="#667eea" />
        <circle cx="140" cy="100" r="8" fill="#764ba2" />
        <circle cx="100" cy="140" r="8" fill="#f093fb" />
        <circle cx="60" cy="100" r="8" fill="#667eea" />
    </svg>
);

const InterestsIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="interestsIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f093fb" />
                <stop offset="100%" stopColor="#f5576c" />
            </linearGradient>
        </defs>
        {/* Heart/passion representation */}
        <path
            d="M100,170 C100,170 40,130 40,90 C40,70 50,50 70,50 C85,50 95,60 100,70 C105,60 115,50 130,50 C150,50 160,70 160,90 C160,130 100,170 100,170 Z"
            fill="url(#interestsIconGradient)"
            opacity="0.8"
        />
        <circle cx="100" cy="100" r="70" fill="url(#interestsIconGradient)" opacity="0.1" />
        <circle cx="100" cy="100" r="20" fill="url(#interestsIconGradient)" opacity="0.6" />
    </svg>
);

const CategoriesIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="categoriesIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
        </defs>
        {/* Target/bullseye representation */}
        <circle cx="100" cy="100" r="70" fill="url(#categoriesIconGradient)" opacity="0.1" />
        <circle cx="100" cy="100" r="50" fill="url(#categoriesIconGradient)" opacity="0.2" />
        <circle cx="100" cy="100" r="30" fill="url(#categoriesIconGradient)" opacity="0.6" />
        <circle cx="100" cy="100" r="15" fill="url(#categoriesIconGradient)" />
        <circle cx="100" cy="100" r="8" fill="white" />
    </svg>
);

const GoalsIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="goalsIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
        </defs>
        {/* Star/achievement representation */}
        <circle cx="100" cy="100" r="70" fill="url(#goalsIconGradient)" opacity="0.1" />
        <path
            d="M 100,40 L 115,80 L 160,85 L 127,115 L 135,160 L 100,137 L 65,160 L 73,115 L 40,85 L 85,80 Z"
            fill="url(#goalsIconGradient)"
            stroke="#ff6b6b"
            strokeWidth="2"
        />
        <circle cx="100" cy="100" r="20" fill="white" opacity="0.8" />
    </svg>
);

const ActivitiesIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="activitiesIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
        </defs>
        {/* Checkmark/completion representation */}
        <circle cx="100" cy="100" r="70" fill="url(#activitiesIconGradient)" opacity="0.2" />
        <circle cx="100" cy="100" r="50" fill="url(#activitiesIconGradient)" opacity="0.6" />
        <path
            d="M 60,100 L 85,125 L 140,70"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Interactive5StepJourney() {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            num: 1,
            title: 'Values',
            category: 'LifeFrame',
            color: 'teal',
            IconComponent: ValuesIcon,
            description: 'Identify the principles that guide your life',
            example: 'Circle values like "Integrity," "Growth," "Family" and prioritize your top 10-15',
            time: '15-20 min',
        },
        {
            num: 2,
            title: 'Interests',
            category: 'LifeFrame',
            color: 'teal',
            IconComponent: InterestsIcon,
            description: 'Discover activities that bring you joy and energy',
            example: 'Mark interests you currently enjoy and underline ones you want to explore',
            time: '10-15 min',
        },
        {
            num: 3,
            title: 'Life Categories',
            category: 'LifeFrame',
            color: 'teal',
            IconComponent: CategoriesIcon,
            description: 'Define the key areas of your life, including your Purpose',
            example: 'Select categories like Health, Career, Relationships and define your Purpose',
            time: '20-30 min',
        },
        {
            num: 4,
            title: 'Goals & Changes',
            category: 'Roadmap',
            color: 'blue',
            IconComponent: GoalsIcon,
            description: 'Set specific goals for each Life Category',
            example: 'Health: "Exercise 5x/week" | Career: "Get promoted within 1 year"',
            time: '30-45 min',
        },
        {
            num: 5,
            title: 'Activities',
            category: 'Roadmap',
            color: 'blue',
            IconComponent: ActivitiesIcon,
            description: 'Break down goals into actionable activities',
            example: 'Exercise goal → "Join gym Monday," "HIIT class Tue/Thu," "Run Sat mornings"',
            time: '45-60 min',
        },
    ];

    const currentStep = steps[activeStep - 1];

    return (
        <div className="mt-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 shadow-xl">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Your 5-Step Journey
            </h3>

            {/* Step Navigation */}
            <div className="flex justify-center items-center gap-3 mb-12 flex-wrap">
                {steps.map((step) => (
                    <button
                        key={step.num}
                        onClick={() => setActiveStep(step.num)}
                        className={`relative flex items-center justify-center transition-all ${activeStep === step.num
                                ? 'scale-110'
                                : 'scale-90 opacity-60 hover:opacity-100'
                            }`}
                    >
                        {/* Connection line */}
                        {step.num < 5 && (
                            <div
                                className={`absolute left-full w-8 h-1 ${activeStep > step.num
                                        ? 'bg-gradient-to-r from-teal-500 to-blue-500'
                                        : 'bg-gray-300'
                                    }`}
                            />
                        )}

                        <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all ${activeStep === step.num
                                    ? step.color === 'teal'
                                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg'
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                                    : activeStep > step.num
                                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                        : 'bg-white text-gray-400 border-2 border-gray-300'
                                }`}
                        >
                            {activeStep > step.num ? '✓' : step.num}
                        </div>
                    </button>
                ))}
            </div>

            {/* Active Step Details */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        {/* SVG Icon */}
                        <div className="w-16 h-16 flex-shrink-0">
                            <currentStep.IconComponent />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Step {currentStep.num} - {currentStep.category}
                            </div>
                            <h4 className="text-3xl font-bold text-gray-900">{currentStep.title}</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Estimated Time</div>
                        <div className="text-lg font-semibold text-purple-600">{currentStep.time}</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">What You'll Do:</h5>
                        <p className="text-gray-700">{currentStep.description}</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Example:</h5>
                        <p className="text-sm text-gray-700 italic">{currentStep.example}</p>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                        disabled={activeStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition ${activeStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                    </button>

                    <div className="text-sm text-gray-500">
                        {activeStep} of {steps.length}
                    </div>

                    {activeStep < 5 ? (
                        <button
                            onClick={() => setActiveStep(Math.min(5, activeStep + 1))}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition"
                        >
                            Next Step
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">
                            Start Your Journey
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${(activeStep / 5) * 100}%` }}
                    />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                    Complete all 5 steps to build your personalized path to contentment
                </p>
            </div>
        </div>
    );
}
