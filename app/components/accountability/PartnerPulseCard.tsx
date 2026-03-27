// app/components/accountability/PartnerPulseCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PartnerActivityFeed } from './PartnerActivityFeed';
import { WeeklyComparison } from './WeeklyComparison';
import { getPartnerActivity } from '@/lib/accountability';

// SVG Icons
const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
  </svg>
);
const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const CheckSmall = () => (
  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface Partner {
  id: string;
  partner: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface PartnerPulseCardProps {
  partnership: Partner;
  onViewProgress: () => void;
  onCheckIn: () => void;
  onEnd: () => void;
}

export function PartnerPulseCard({
  partnership,
  onViewProgress,
  onCheckIn,
  onEnd
}: PartnerPulseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'comparison'>('activity');
  const [activeToday, setActiveToday] = useState(false);
  const [activitiesLoggedToday, setActivitiesLoggedToday] = useState(0);

  const partner = partnership.partner;

  // Check if partner was active today using real data
  useEffect(() => {
    const checkTodayActivity = async () => {
      const { data } = await getPartnerActivity(partner.id, 20);
      if (data && data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayActivities = data.filter((a: any) => 
          a.created_at && a.created_at.startsWith(today)
        );
        setActiveToday(todayActivities.length > 0);
        setActivitiesLoggedToday(todayActivities.length);
      }
    };
    checkTodayActivity();
  }, [partner.id]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar with pulse */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
              {partner.avatar_url ? (
                <Image 
                  src={partner.avatar_url} 
                  alt={partner.full_name} 
                  width={48} 
                  height={48} 
                  className="rounded-full" 
                />
              ) : (
                partner.full_name?.charAt(0) || '?'
              )}
            </div>

            {/* Activity pulse indicator */}
            {activeToday && (
              <div className="absolute -top-1 -right-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {partner.full_name}
              {activeToday && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                  Active today
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">Accountability Partner</p>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <ChevronIcon expanded={expanded} />
          </button>
        </div>

        {/* Activity summary (when collapsed) */}
        {!expanded && activeToday && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <CheckSmall />
              <span className="font-semibold">{activitiesLoggedToday} {activitiesLoggedToday === 1 ? 'activity' : 'activities'}</span> logged today
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onViewProgress} 
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors"
          >
            <ChartIcon />
            Progress
          </button>
          
          <button 
            onClick={onCheckIn} 
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <MessageIcon />
            Check In
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 animate-fade-in">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Recent Activity
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'comparison'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Weekly Stats
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'activity' ? (
              <PartnerActivityFeed 
                partnerId={partner.id} 
                partnerName={partner.full_name}
                compact
              />
            ) : (
              <WeeklyComparison 
                partnerId={partner.id}
                partnerName={partner.full_name}
              />
            )}
          </div>
        </div>
      )}

      {/* End partnership (collapsed state only) */}
      {!expanded && (
        <button 
          onClick={onEnd} 
          className="w-full text-[11px] text-gray-400 hover:text-red-500 transition-colors py-2 border-t border-gray-100"
        >
          End Partnership
        </button>
      )}
    </div>
  );
}
