// app/roadmap/components/GoalSuggestionWizard.tsx
'use client';

import { useState } from 'react';
import { GOAL_TEMPLATES, GoalTemplate } from '@/lib/goal-templates';

interface GoalSuggestionWizardProps {
  userCategories: string[]; // Categories from their LifeFrame
  userValues?: string[]; // For auto-connecting to LifeFrame
  userPurpose?: string[]; // For auto-connecting to LifeFrame
  onComplete: (selectedGoals: SelectedGoal[]) => void;
  onSkip: () => void;
}

export interface SelectedGoal {
  category: string;
  templateId: string;
  goal: string;
  activities: string[];
  connectedValues?: string[];
  connectedPurpose?: string[];
}

type WizardStep = 'choose-categories' | 'browse-goals';

export function GoalSuggestionWizard({
  userCategories,
  userValues = [],
  userPurpose = [],
  onComplete,
  onSkip
}: GoalSuggestionWizardProps) {
  const [step, setStep] = useState<WizardStep>('choose-categories');
  const [focusedCategories, setFocusedCategories] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [allSelectedGoals, setAllSelectedGoals] = useState<SelectedGoal[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Custom goal entries for each category
  const [customGoals, setCustomGoals] = useState<{ goal: string; activities: string[] }[]>([{ goal: '', activities: ['', ''] }]);

  // Filtered list based on user's choice
  const activeCategories = Array.from(focusedCategories);
  const currentCategory = activeCategories[currentCategoryIndex];
  const templates = currentCategory ? (GOAL_TEMPLATES[currentCategory] || []) : [];
  const isLastCategory = currentCategoryIndex === activeCategories.length - 1;

  const toggleFocusCategory = (category: string) => {
    setFocusedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleStartBrowsing = () => {
    if (focusedCategories.size === 0) return;
    setCurrentCategoryIndex(0);
    setSelectedTemplateIds([]);
    setStep('browse-goals');
  };

  const toggleTemplate = (template: GoalTemplate) => {
    if (selectedTemplateIds.includes(template.id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter(id => id !== template.id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, template.id]);
    }
  };

  const handleNext = () => {
    // Save custom goals for this category
    const goalsForThisCategory = customGoals
      .filter(g => g.goal.trim() !== '')
      .map((g, idx) => ({
        category: currentCategory,
        templateId: `custom-${currentCategory}-${idx}`,
        goal: g.goal,
        activities: g.activities.filter(a => a.trim() !== ''),
        connectedValues: undefined,
        connectedPurpose: undefined
      }));

    const updatedSelections = [...allSelectedGoals, ...goalsForThisCategory];
    setAllSelectedGoals(updatedSelections);

    if (isLastCategory) {
      onComplete(updatedSelections);
    } else {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setSelectedTemplateIds([]);
      setCustomGoals([{ goal: '', activities: ['', ''] }]);
    }
  };

  const handleSkipCategory = () => {
    if (isLastCategory) {
      onComplete(allSelectedGoals);
    } else {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setSelectedTemplateIds([]);
      setCustomGoals([{ goal: '', activities: ['', ''] }]);
    }
  };

  const addCustomGoal = () => {
    setCustomGoals([...customGoals, { goal: '', activities: ['', ''] }]);
  };

  const updateCustomGoalName = (index: number, value: string) => {
    setCustomGoals(prev => prev.map((g, i) => i === index ? { ...g, goal: value } : g));
  };

  const updateCustomActivity = (goalIndex: number, actIndex: number, value: string) => {
    setCustomGoals(prev => prev.map((g, i) => {
      if (i !== goalIndex) return g;
      const activities = [...g.activities];
      activities[actIndex] = value;
      return { ...g, activities };
    }));
  };

  const addActivityToGoal = (goalIndex: number) => {
    setCustomGoals(prev => prev.map((g, i) => {
      if (i !== goalIndex) return g;
      return { ...g, activities: [...g.activities, ''] };
    }));
  };

  const removeCustomGoal = (index: number) => {
    if (customGoals.length <= 1) return;
    setCustomGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkipAll = () => {
    onSkip();
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      challenging: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[difficulty as keyof typeof colors] || colors.medium;
  };

  const getTimeframeLabel = (timeframe: string) => {
    const labels = {
      '1-month': '1 Month',
      '3-month': '3 Months',
      '6-month': '6 Months',
      '1-year': '1 Year'
    };
    return labels[timeframe as keyof typeof labels] || timeframe;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Health: '💪',
      Career: '💼',
      Relationships: '❤️',
      Purpose: '🎯',
      Social: '🤝',
      Learning: '📚',
      Finance: '💰',
      Spiritual: '🙏',
      Creative: '🎨'
    };
    return icons[category] || '⭐';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Health: 'from-green-500 to-emerald-600',
      Career: 'from-blue-500 to-indigo-600',
      Relationships: 'from-pink-500 to-rose-600',
      Purpose: 'from-yellow-500 to-amber-600',
      Social: 'from-teal-500 to-cyan-600',
      Learning: 'from-violet-500 to-purple-600',
      Finance: 'from-emerald-500 to-green-600',
      Spiritual: 'from-indigo-500 to-blue-600',
      Creative: 'from-orange-500 to-red-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  // ─── STEP 1: Choose which categories to focus on ───
  if (step === 'choose-categories') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-3xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Choose Your Focus Areas</h2>
                <p className="text-indigo-200 mt-1">
                  Which life categories do you want to set goals for?
                </p>
              </div>
              <button
                onClick={handleSkipAll}
                className="text-white/70 hover:text-white text-sm underline flex-shrink-0"
              >
                Skip All
              </button>
            </div>
            <p className="text-indigo-100 text-sm">
              Pick 1–3 to start with. You can add more categories later anytime.
            </p>
          </div>

          {/* Category Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {userCategories.map((category) => {
                const isSelected = focusedCategories.has(category);
                const templateCount = (GOAL_TEMPLATES[category] || []).length;

                return (
                  <button
                    key={category}
                    onClick={() => toggleFocusCategory(category)}
                    className={`
                      relative p-5 rounded-2xl border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
                    <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {category}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {templateCount} goal suggestion{templateCount !== 1 ? 's' : ''}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* No categories message */}
            {userCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No life categories found.</p>
                <p className="text-sm text-gray-500 mt-2">Complete your LifeFrame first to get personalized suggestions.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {focusedCategories.size > 0 ? (
                  <span className="font-semibold text-indigo-600">
                    {focusedCategories.size} categor{focusedCategories.size !== 1 ? 'ies' : 'y'} selected
                  </span>
                ) : (
                  <span>Select at least one category to continue</span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipAll}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  I'll Add My Own
                </button>
                <button
                  onClick={handleStartBrowsing}
                  disabled={focusedCategories.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Browse Suggestions →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Browse goals for selected categories ───
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getCategoryColor(currentCategory)} text-white p-8 rounded-t-3xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getCategoryIcon(currentCategory)}</div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">{currentCategory} Goals</h2>
                <p className="text-white/80 mt-1">
                  Category {currentCategoryIndex + 1} of {activeCategories.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setStep('choose-categories');
                  setCurrentCategoryIndex(0);
                  setSelectedTemplateIds([]);
                }}
                className="text-white/80 hover:text-white text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change Categories
              </button>
              <button
                onClick={handleSkipAll}
                className="text-white/80 hover:text-white text-sm underline"
              >
                Skip All
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activeCategories.map((cat, idx) => (
              <div
                key={cat}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  idx === currentCategoryIndex
                    ? 'bg-white text-gray-900'
                    : idx < currentCategoryIndex
                      ? 'bg-white/30 text-white'
                      : 'bg-white/15 text-white/70'
                }`}
              >
                {idx < currentCategoryIndex ? '✓ ' : ''}{cat}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${((currentCategoryIndex + 1) / activeCategories.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content — Two Column Layout */}
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT COLUMN: User's Own Goals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Goals</h3>
                  <p className="text-xs text-gray-500">Write your own goals and activities</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {customGoals.map((cg, goalIdx) => (
                  <div key={goalIdx} className="bg-indigo-50/50 border-2 border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Goal {goalIdx + 1}</span>
                      {customGoals.length > 1 && (
                        <button
                          onClick={() => removeCustomGoal(goalIdx)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={cg.goal}
                      onChange={(e) => updateCustomGoalName(goalIdx, e.target.value)}
                      placeholder="e.g., Run a 5K, Read 12 books this year..."
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-gray-900 text-sm focus:border-indigo-400 focus:outline-none mb-3 font-medium"
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Activities / Steps:</p>
                      {cg.activities.map((act, actIdx) => (
                        <input
                          key={actIdx}
                          type="text"
                          value={act}
                          onChange={(e) => updateCustomActivity(goalIdx, actIdx, e.target.value)}
                          placeholder={`Activity ${actIdx + 1}...`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-indigo-400 focus:outline-none"
                        />
                      ))}
                      {cg.activities.length < 5 && (
                        <button
                          onClick={() => addActivityToGoal(goalIdx)}
                          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add activity
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={addCustomGoal}
                  className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-400 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Goal
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Read-only Examples */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Examples to Check Out</h3>
                  <p className="text-xs text-gray-500">For inspiration — use your own words on the left!</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {templates.length > 0 ? templates.map(template => (
                  <div
                    key={template.id}
                    className="bg-amber-50/60 border border-amber-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-bold text-gray-900">{template.goal}</h4>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300">
                          {getTimeframeLabel(template.timeframe)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>

                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">Example Activities:</p>
                      <ul className="space-y-0.5">
                        {template.activities.map((activity, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-amber-500 flex-shrink-0">•</span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-sm">No examples available for {currentCategory} yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Create your own goals on the left!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {customGoals.filter(g => g.goal.trim()).length > 0 ? (
                <span className="font-semibold text-indigo-600">
                  {customGoals.filter(g => g.goal.trim()).length} goal{customGoals.filter(g => g.goal.trim()).length !== 1 ? 's' : ''} entered
                </span>
              ) : (
                <span>Enter your goals on the left, or skip to add later</span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipCategory}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Skip {currentCategory}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastCategory ? 'Finish & Build Roadmap' : 'Next Category →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
