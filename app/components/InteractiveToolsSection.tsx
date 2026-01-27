'use client';

import { useState } from 'react';

export function InteractiveToolsSection() {
    const [activeTab, setActiveTab] = useState<'lifeframe' | 'roadmap'>('lifeframe');

    return (
        <section id="tools" className="min-h-screen flex items-center py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4 w-full">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-gray-900 mb-6">
                        The LifeAligner Tools
                    </h2>
                    <p className="text-xl text-gray-600">
                        Interactive frameworks that evolve with you
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-4 mb-12">
                    <button
                        onClick={() => setActiveTab('lifeframe')}
                        className={`px-8 py-4 rounded-full font-semibold text-lg transition-all ${activeTab === 'lifeframe'
                                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        📋 LifeFrame
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`px-8 py-4 rounded-full font-semibold text-lg transition-all ${activeTab === 'roadmap'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        🗺️ Roadmap
                    </button>
                </div>

                {/* LifeFrame Interactive View */}
                {activeTab === 'lifeframe' && (
                    <div className="animate-fade-in">
                        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 md:p-12 shadow-xl">
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                        Your Foundation
                                    </h3>
                                    <p className="text-lg text-gray-700 mb-6">
                                        The LifeFrame captures the core elements that define who you are and what matters to you.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-500">
                                            <h4 className="font-bold text-gray-900 mb-2">📌 Values</h4>
                                            <p className="text-sm text-gray-600">
                                                Your principles and standards - the non-negotiables that guide your decisions
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500">
                                            <h4 className="font-bold text-gray-900 mb-2">❤️ Interests</h4>
                                            <p className="text-sm text-gray-600">
                                                Activities that energize you and deploy your creativity to help others
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500">
                                            <h4 className="font-bold text-gray-900 mb-2">🎯 Life Categories</h4>
                                            <p className="text-sm text-gray-600">
                                                The key areas of your life, including your Purpose
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 italic mt-6">
                                        Your LifeFrame evolves as you learn and grow
                                    </p>
                                </div>

                                {/* Right: Interactive Mini LifeFrame */}
                                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-teal-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg"></div>
                                        <h4 className="text-xl font-bold text-gray-900">Sample LifeFrame</h4>
                                    </div>

                                    {/* Values Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">📌</span>
                                            <h5 className="font-semibold text-gray-900">Top Values</h5>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Integrity', 'Growth', 'Family', 'Creativity'].map((value) => (
                                                <span
                                                    key={value}
                                                    className="bg-gradient-to-r from-teal-100 to-blue-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700"
                                                >
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interests Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">❤️</span>
                                            <h5 className="font-semibold text-gray-900">Key Interests</h5>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                                                🎨 Creative problem solving
                                            </div>
                                            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                                                🏃 Outdoor activities & fitness
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose Preview */}
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🎯</span>
                                            <h5 className="font-semibold text-gray-900">My Purpose</h5>
                                        </div>
                                        <p className="text-sm text-gray-700 italic">
                                            "Help others discover meaningful work that aligns with their values"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Roadmap Interactive View */}
                {activeTab === 'roadmap' && (
                    <div className="animate-fade-in">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl">
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                        Your Action Plan
                                    </h3>
                                    <p className="text-lg text-gray-700 mb-6">
                                        Transform your LifeFrame into specific, achievable goals with concrete activities.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500">
                                            <h4 className="font-bold text-gray-900 mb-2">🎯 Life Categories</h4>
                                            <p className="text-sm text-gray-600">
                                                Health, Career, Relationships, Purpose, etc.
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500">
                                            <h4 className="font-bold text-gray-900 mb-2">⭐ Goals & Behavior Changes</h4>
                                            <p className="text-sm text-gray-600">
                                                Specific outcomes you want to achieve in each category
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-pink-500">
                                            <h4 className="font-bold text-gray-900 mb-2">✅ Activities</h4>
                                            <p className="text-sm text-gray-600">
                                                Concrete actions to accomplish your goals (next 3 months)
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 italic mt-6">
                                        Update your Roadmap every 3-6 months as you progress
                                    </p>
                                </div>

                                {/* Right: Interactive Mini Roadmap */}
                                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                                        <h4 className="text-xl font-bold text-gray-900">Sample Roadmap</h4>
                                    </div>

                                    {/* Category: Health */}
                                    <div className="mb-6 border-l-4 border-green-500 pl-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">💪</span>
                                            <h5 className="font-semibold text-gray-900">Health</h5>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Goal: Improve physical fitness
                                            </p>
                                            <div className="space-y-1 text-xs text-gray-600 ml-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Exercise 5x per week</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Join HIIT class at local gym</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Track workouts in app</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category: Career */}
                                    <div className="mb-6 border-l-4 border-blue-500 pl-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">💼</span>
                                            <h5 className="font-semibold text-gray-900">Career</h5>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Goal: Develop leadership skills
                                            </p>
                                            <div className="space-y-1 text-xs text-gray-600 ml-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600">✓</span>
                                                    <span>Lead team project Q1</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600">✓</span>
                                                    <span>Take management course</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Full Roadmap Link */}
                                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                                        Create Your Roadmap →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
