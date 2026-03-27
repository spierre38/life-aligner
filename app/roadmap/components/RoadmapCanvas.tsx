// app/roadmap/components/RoadmapCanvas.tsx
'use client';

import { RoadmapLane } from './RoadmapLane';
import { GoalDetailModal } from './GoalDetailModal';
import { useState } from 'react';
import { calculateLaneDecay } from '@/lib/roadmap-decay-helpers';

export interface RoadmapCanvasProps {
  lanes: LaneData[];
  onUpdateGoal: (laneId: string, goalId: string, updates: Partial<Goal>) => void;
  onToggleActivity: (laneId: string, goalId: string, activityId: string) => void;
  onAddGoal: (category: string) => void;
}

export interface LaneData {
  id: string;
  category: string;
  emoji: string;
  color: string;
  goals: Goal[];
  overallProgress: number; // 0-100
}

export interface Goal {
  id: string;
  title: string;
  type: 'goal' | 'behavior_change';
  why?: string;
  activities: Activity[];
  position: number; // X position on lane (0-100)
  connectedValues?: string[];
  connectedPurpose?: string[];
}

export interface Activity {
  id: string;
  text: string;
  completed: boolean;
  completedCount?: number;
  logs?: any[];
}

export function RoadmapCanvas({ lanes, onUpdateGoal, onToggleActivity, onAddGoal }: RoadmapCanvasProps) {
  const [selectedGoal, setSelectedGoal] = useState<{ lane: LaneData; goal: Goal } | null>(null);

  // Calculate overall progress across all lanes
  const overallProgress = lanes.length > 0
    ? Math.round(lanes.reduce((sum, lane) => sum + lane.overallProgress, 0) / lanes.length)
    : 0;

  const totalGoals = lanes.reduce((sum, lane) => sum + lane.goals.length, 0);
  const completedGoals = lanes.reduce((sum, lane) =>
    sum + lane.goals.filter(g => {
      const completed = g.activities.filter(a => a.completed).length;
      return completed === g.activities.length && g.activities.length > 0;
    }).length, 0
  );

  const handleGoalClick = (lane: LaneData, goal: Goal) => {
    setSelectedGoal({ lane, goal });
  };

  const handleCloseModal = () => {
    setSelectedGoal(null);
  };

  // Category health based on recent activity
  const getCategoryHealth = (lane: LaneData) => {
    const recency = calculateLaneDecay(lane.goals);
    return recency.decayLevel; // 'active' | 'fading' | 'neglected'
  };

  return (
    <div className="relative">
      {/* Journey Dashboard Header */}
      <div className="mb-8 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Journey Map</h2>
            <p className="text-sm text-gray-500 mt-1">
              {completedGoals > 0
                ? `${completedGoals} of ${totalGoals} goals completed`
                : `${totalGoals} active goals across ${lanes.length} areas`
              }
            </p>
          </div>

          {/* Overall progress ring */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${overallProgress * 1.76} 176`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">{overallProgress}%</span>
            </div>
          </div>
        </div>

        {/* Category Health Dots */}
        <div className="flex flex-wrap gap-3">
          {lanes.map(lane => {
            const health = getCategoryHealth(lane);
            return (
              <div key={lane.id} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  health === 'active' ? 'bg-green-500 animate-pulse' :
                  health === 'fading' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} />
                <span className="text-gray-600 font-medium">{lane.emoji} {lane.category}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lane Container */}
      <div className="space-y-6">
        {lanes.map((lane) => (
          <RoadmapLane
            key={lane.id}
            lane={lane}
            onGoalClick={(goal) => handleGoalClick(lane, goal)}
            onAddGoal={() => onAddGoal(lane.category)}
          />
        ))}
      </div>

      {/* Empty State */}
      {lanes.length === 0 && (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Journey Awaits</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Add goals to start building your personal roadmap. Each goal becomes a milestone on your journey.
          </p>
        </div>
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          lane={selectedGoal.lane}
          goal={selectedGoal.goal}
          onClose={handleCloseModal}
          onUpdateGoal={(updates) => onUpdateGoal(selectedGoal.lane.id, selectedGoal.goal.id, updates)}
          onToggleActivity={(activityId) => onToggleActivity(selectedGoal.lane.id, selectedGoal.goal.id, activityId)}
        />
      )}
    </div>
  );
}
