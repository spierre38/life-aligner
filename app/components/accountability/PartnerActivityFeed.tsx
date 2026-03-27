// app/components/accountability/PartnerActivityFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getPartnerActivity, sendCongrats } from '@/lib/accountability';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const TargetIcon = () => (
  <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const PaletteIcon = () => (
  <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);
const ThoughtIcon = () => (
  <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const SparkleIcon = () => (
  <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ClapIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
  </svg>
);

interface PartnerActivityFeedProps {
  partnerId: string;
  partnerName: string;
  compact?: boolean;
}

export function PartnerActivityFeed({ partnerId, partnerName, compact = false }: PartnerActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadActivity();
  }, [partnerId]);

  const loadActivity = async () => {
    setLoading(true);
    const { data, error } = await getPartnerActivity(partnerId, compact ? 3 : 10);
    if (!error && data) {
      setActivities(data);
    }
    setLoading(false);
  };

  const handleCongrats = async (activity: any) => {
    if (reactedIds.has(activity.id)) return;
    
    setReactedIds(prev => new Set(prev).add(activity.id));
    
    const { error } = await sendCongrats(partnerId, {
      activity_type: activity.activity_type,
      activity_data: activity.activity_data,
    });
    
    if (error) {
      // Revert on error
      setReactedIds(prev => {
        const next = new Set(prev);
        next.delete(activity.id);
        return next;
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'logged_activity':
      case 'goal_completed': return <CheckIcon />;
      case 'completed_goal': return <TargetIcon />;
      case 'added_goal':
      case 'roadmap_updated': return <PaletteIcon />;
      case 'reflection':
      case 'milestone_posted': return <ThoughtIcon />;
      default: return <SparkleIcon />;
    }
  };

  const getActivityMessage = (activity: any) => {
    const type = activity.activity_type;
    const data = activity.activity_data || {};

    switch (type) {
      case 'logged_activity':
        return `logged ${data.count || 1} ${(data.count || 1) === 1 ? 'activity' : 'activities'}${data.category ? ` in ${data.category}` : ''}`;
      case 'goal_completed':
      case 'completed_goal':
        return `completed "${data.goal || data.title || 'a goal'}"`;
      case 'added_goal':
      case 'roadmap_updated':
        return `updated their roadmap${data.category ? ` in ${data.category}` : ''}`;
      case 'reflection':
        return 'added a reflection';
      case 'milestone_posted':
        return `posted a milestone${data.title ? `: "${data.title}"` : ''}`;
      case 'value_changed':
        return 'updated their values';
      default:
        return 'updated their progress';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-3' : 'py-6'} text-gray-400 text-sm`}>
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {activities.map((activity) => {
        const reacted = reactedIds.has(activity.id);
        return (
          <div 
            key={activity.id} 
            className={`flex items-start gap-3 ${compact ? 'p-2' : 'p-3'} rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.activity_type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-900`}>
                <span className="font-semibold">{partnerName}</span>
                {' '}
                {getActivityMessage(activity)}
              </p>
              <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-0.5`}>
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>

              {/* Additional details */}
              {!compact && activity.activity_data?.lastActivity && (
                <p className="text-xs text-gray-600 mt-1 italic">
                  &ldquo;{activity.activity_data.lastActivity}&rdquo;
                </p>
              )}
            </div>

            {/* Quick reaction button */}
            {!compact && (
              <button 
                className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                  reacted 
                    ? 'text-red-500 bg-red-50 cursor-default' 
                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
                }`}
                onClick={() => handleCongrats(activity)}
                disabled={reacted}
                title={reacted ? 'Congrats sent!' : 'Send congrats'}
              >
                {reacted ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                  </svg>
                ) : (
                  <ClapIcon />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
