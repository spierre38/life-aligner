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

export function GoalSuggestionWizard({
  userCategories,
  userValues = [],
  userPurpose = [],
  onComplete,
  onSkip
}: GoalSuggestionWizardProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [allSelectedGoals, setAllSelectedGoals] = useState<SelectedGoal[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const currentCategory = userCategories[currentCategoryIndex];
  const templates = GOAL_TEMPLATES[currentCategory] || [];
  const isLastCategory = currentCategoryIndex === userCategories.length - 1;

  const toggleTemplate = (template: GoalTemplate) => {
    if (selectedTemplateIds.includes(template.id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter(id => id !== template.id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, template.id]);
    }
  };

  const handleNext = () => {
    // Save current selections
    const selectedForThisCategory = templates
      .filter(t => selectedTemplateIds.includes(t.id))
      .map(t => ({
        category: currentCategory,
        templateId: t.id,
        goal: t.goal,
        activities: t.activities,
        // Auto-connect to relevant values/purpose if available
        connectedValues: undefined,
        connectedPurpose: undefined
      }));

    const updatedSelections = [...allSelectedGoals, ...selectedForThisCategory];
    setAllSelectedGoals(updatedSelections);

    if (isLastCategory) {
      // Finished all categories
      onComplete(updatedSelections);
    } else {
      // Move to next category
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setSelectedTemplateIds([]); // Reset for next category
    }
  };

  const handleSkipCategory = () => {
    if (isLastCategory) {
      onComplete(allSelectedGoals);
    } else {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setSelectedTemplateIds([]);
    }
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getCategoryIcon(currentCategory)}</div>
              <div>
                <h2 className="text-3xl font-bold">Build Your {currentCategory} Roadmap</h2>
                <p className="text-indigo-100 mt-1">
                  Category {currentCategoryIndex + 1} of {userCategories.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkipAll}
              className="text-white/80 hover:text-white text-sm underline"
            >
              Skip All
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${((currentCategoryIndex + 1) / userCategories.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-lg text-gray-700">
              Select goals that resonate with you. You can customize them later!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Tip:</strong> Choose 2-4 goals to start. You can always add more later.
            </p>
          </div>

          {/* Goal Templates */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {templates.map(template => {
              const isSelected = selectedTemplateIds.includes(template.id);

              return (
                <button
                  key={template.id}
                  onClick={() => toggleTemplate(template)}
                  className={`
                    w-full text-left p-5 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1
                      ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}
                    `}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{template.goal}</h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(template.difficulty)}`}>
                            {template.difficulty}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                            {getTimeframeLabel(template.timeframe)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{template.description}</p>

                      {/* Activities Preview */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Activities (3-month window):</div>
                        <ul className="space-y-1">
                          {template.activities.map((activity, idx) => (
                            <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                              <span className="text-indigo-600 flex-shrink-0">•</span>
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No templates available for this category yet.</p>
              <p className="text-sm text-gray-500 mt-2">Skip to add your own goals manually.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTemplateIds.length > 0 ? (
                <span className="font-semibold text-indigo-600">
                  {selectedTemplateIds.length} goal{selectedTemplateIds.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span>Select at least one goal, or skip to add your own</span>
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
