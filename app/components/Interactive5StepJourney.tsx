'use client';

import { useState } from 'react';

export function Interactive5StepJourney() {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            num: 1,
            title: 'Values',
            category: 'LifeFrame',
            color: 'teal',
            icon: '📌',
            description: 'Identify the principles that guide your life',
            example: 'Circle values like "Integrity," "Growth," "Family" and prioritize your top 10-15',
            time: '15-20 min',
        },
        {
            num: 2,
            title: 'Interests',
            category: 'LifeFrame',
            color: 'teal',
            icon: '❤️',
            description: 'Discover activities that bring you joy and energy',
            example: 'Mark interests you currently enjoy and underline ones you want to explore',
            time: '10-15 min',
        },
        {
            num: 3,
            title: 'Life Categories',
            category: 'LifeFrame',
            color: 'teal',
            icon: '🎯',
            description: 'Define the key areas of your life, including your Purpose',
            example: 'Select categories like Health, Career, Relationships and define your Purpose',
            time: '20-30 min',
        },
        {
            num: 4,
            title: 'Goals & Changes',
            category: 'Roadmap',
            color: 'blue',
            icon: '⭐',
            description: 'Set specific goals for each Life Category',
            example: 'Health: "Exercise 5x/week" | Career: "Get promoted within 1 year"',
            time: '30-45 min',
        },
        {
            num: 5,
            title: 'Activities',
            category: 'Roadmap',
            color: 'blue',
            icon: '✅',
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{currentStep.icon}</span>
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
