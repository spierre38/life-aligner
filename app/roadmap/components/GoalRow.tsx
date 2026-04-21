'use client';

type Activity = { id: string; text: string; completed_dates: string[]; logs: any[]; notes: string };
type RoadmapItem = {
    id: string; category: string; type: 'goal' | 'behavior_change';
    title: string; why: string; activities: Activity[];
    quarter: string; reflections: any[]; archived: boolean;
    archived_date?: string; connected_values?: string[]; connected_purpose?: string[];
};

interface Props {
    item: RoadmapItem;
    onOpen: (item: RoadmapItem) => void;
}

export function GoalRow({ item, onOpen }: Props) {
    const total = item.activities.length;
    const done = item.activities.filter(a => a.completed_dates.length > 0).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const typeBadge = item.type === 'behavior_change'
        ? { label: 'Habit', cls: 'bg-purple-100 text-purple-700' }
        : { label: 'Goal', cls: 'bg-blue-100 text-blue-700' };

    return (
        <button
            onClick={() => onOpen(item)}
            className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
            {/* Title + type */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge.cls}`}>
                        {typeBadge.label}
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                {item.why && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.why}</p>
                )}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-gray-500">{done}/{total} activities</p>
                    {total > 0 && (
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gray-900 transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}
