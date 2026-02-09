// app/components/EmptyStates.tsx
// Beautiful empty state illustrations for LifeAligner

type EmptyStateProps = {
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    illustration?: 'todo' | 'roadmap' | 'values' | 'interests' | 'categories' | 'completed';
};

export function EmptyState({ title, description, action, illustration = 'todo' }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <div className="mb-6">
                {illustration === 'todo' && <TodoEmptyIllustration />}
                {illustration === 'roadmap' && <RoadmapEmptyIllustration />}
                {illustration === 'values' && <ValuesEmptyIllustration />}
                {illustration === 'interests' && <InterestsEmptyIllustration />}
                {illustration === 'categories' && <CategoriesEmptyIllustration />}
                {illustration === 'completed' && <CompletedEmptyIllustration />}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Individual Illustrations

function TodoEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Clipboard */}
            <rect x="50" y="30" width="100" height="140" rx="8" fill="#E0E7FF" stroke="#6366F1" strokeWidth="3" />
            <rect x="70" y="20" width="60" height="15" rx="7.5" fill="#6366F1" />

            {/* Checkboxes */}
            <rect x="70" y="60" width="20" height="20" rx="4" fill="white" stroke="#6366F1" strokeWidth="2" />
            <rect x="70" y="90" width="20" height="20" rx="4" fill="white" stroke="#6366F1" strokeWidth="2" />
            <rect x="70" y="120" width="20" height="20" rx="4" fill="white" stroke="#6366F1" strokeWidth="2" />

            {/* Lines */}
            <line x1="100" y1="70" x2="130" y2="70" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="100" x2="130" y2="100" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="130" x2="130" y2="130" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />

            {/* Sparkles */}
            <circle cx="160" cy="50" r="3" fill="#FCD34D" />
            <circle cx="40" cy="80" r="3" fill="#FCD34D" />
            <circle cx="160" cy="140" r="3" fill="#FCD34D" />
        </svg>
    );
}

function RoadmapEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Road path */}
            <path d="M20 180 Q50 100, 100 100 T180 20" stroke="#6366F1" strokeWidth="4" strokeDasharray="8 8" fill="none" />

            {/* Start flag */}
            <circle cx="20" cy="180" r="8" fill="#10B981" stroke="white" strokeWidth="2" />
            <rect x="20" y="165" width="2" height="18" fill="#10B981" />
            <path d="M22 165 L35 170 L22 175 Z" fill="#10B981" />

            {/* Milestone points */}
            <circle cx="100" cy="100" r="6" fill="#A78BFA" stroke="white" strokeWidth="2" />
            <circle cx="140" cy="60" r="6" fill="#A78BFA" stroke="white" strokeWidth="2" />

            {/* End star */}
            <path d="M180 20 L184 28 L193 29 L186 36 L188 45 L180 40 L172 45 L174 36 L167 29 L176 28 Z" fill="#FCD34D" />
        </svg>
    );
}

function ValuesEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Heart */}
            <path d="M100 160 C60 120, 40 100, 40 80 C40 50, 60 40, 80 50 C90 55, 95 60, 100 70 C105 60, 110 55, 120 50 C140 40, 160 50, 160 80 C160 100, 140 120, 100 160 Z" fill="#F472B6" opacity="0.3" />
            <path d="M100 160 C60 120, 40 100, 40 80 C40 50, 60 40, 80 50 C90 55, 95 60, 100 70 C105 60, 110 55, 120 50 C140 40, 160 50, 160 80 C160 100, 140 120, 100 160 Z" stroke="#EC4899" strokeWidth="3" fill="none" />

            {/* Stars around */}
            <circle cx="50" cy="60" r="3" fill="#FCD34D" />
            <circle cx="150" cy="60" r="3" fill="#FCD34D" />
            <circle cx="70" cy="140" r="3" fill="#FCD34D" />
            <circle cx="130" cy="140" r="3" fill="#FCD34D" />
        </svg>
    );
}

function InterestsEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Lightbulb */}
            <ellipse cx="100" cy="140" rx="30" ry="15" fill="#E0E7FF" />
            <path d="M100 50 C80 50, 65 65, 65 90 C65 110, 75 120, 85 135 L115 135 C125 120, 135 110, 135 90 C135 65, 120 50, 100 50 Z" fill="#FCD34D" opacity="0.3" />
            <path d="M100 50 C80 50, 65 65, 65 90 C65 110, 75 120, 85 135 L115 135 C125 120, 135 110, 135 90 C135 65, 120 50, 100 50 Z" stroke="#F59E0B" strokeWidth="3" fill="none" />
            <rect x="90" y="135" width="20" height="10" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" />

            {/* Light rays */}
            <line x1="100" y1="30" x2="100" y2="45" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="140" y1="45" x2="130" y2="55" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="155" y1="80" x2="140" y2="80" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="60" y1="45" x2="70" y2="55" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="80" x2="60" y2="80" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

function CategoriesEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Grid of categories */}
            <rect x="40" y="40" width="50" height="50" rx="8" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
            <rect x="110" y="40" width="50" height="50" rx="8" fill="#FCE7F3" stroke="#EC4899" strokeWidth="2" />
            <rect x="40" y="110" width="50" height="50" rx="8" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
            <rect x="110" y="110" width="50" height="50" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />

            {/* Icons in each */}
            <text x="65" y="73" fontSize="24" textAnchor="middle">💪</text>
            <text x="135" y="73" fontSize="24" textAnchor="middle">❤️</text>
            <text x="65" y="143" fontSize="24" textAnchor="middle">🎯</text>
            <text x="135" y="143" fontSize="24" textAnchor="middle">⭐</text>
        </svg>
    );
}

function CompletedEmptyIllustration() {
    return (
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
            {/* Trophy */}
            <ellipse cx="100" cy="170" rx="40" ry="8" fill="#E0E7FF" />
            <rect x="95" y="150" width="10" height="20" fill="#6366F1" />
            <path d="M70 150 L70 90 C70 80, 75 75, 85 75 L115 75 C125 75, 130 80, 130 90 L130 150 Z" fill="#FCD34D" opacity="0.3" />
            <path d="M70 150 L70 90 C70 80, 75 75, 85 75 L115 75 C125 75, 130 80, 130 90 L130 150 Z" stroke="#F59E0B" strokeWidth="3" fill="none" />

            {/* Handles */}
            <path d="M70 100 C50 100, 40 90, 40 70" stroke="#F59E0B" strokeWidth="3" fill="none" />
            <path d="M130 100 C150 100, 160 90, 160 70" stroke="#F59E0B" strokeWidth="3" fill="none" />

            {/* Star on trophy */}
            <path d="M100 110 L103 118 L112 119 L106 125 L108 134 L100 129 L92 134 L94 125 L88 119 L97 118 Z" fill="#FCD34D" />

            {/* Confetti */}
            <circle cx="50" cy="50" r="3" fill="#EC4899" />
            <circle cx="150" cy="50" r="3" fill="#3B82F6" />
            <circle cx="60" cy="160" r="3" fill="#10B981" />
            <circle cx="140" cy="160" r="3" fill="#F59E0B" />
        </svg>
    );
}

// Compact version for smaller spaces
export function CompactEmptyState({ message, icon }: { message: string; icon?: string }) {
    return (
        <div className="text-center py-8">
            <div className="text-6xl mb-3">{icon || '📋'}</div>
            <p className="text-gray-500 text-sm">{message}</p>
        </div>
    );
}
