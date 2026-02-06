'use client';

type LifeFrameConnectionProps = {
    selectedValues?: string[];
    selectedPurpose?: string[];
    compact?: boolean;
};

export default function LifeFrameConnection({
    selectedValues = [],
    selectedPurpose = [],
    compact = false
}: LifeFrameConnectionProps) {

    if (selectedValues.length === 0 && selectedPurpose.length === 0) {
        return null;
    }

    // Value to color/emoji mapping (from workbook values)
    const valueStyles: Record<string, { color: string; emoji: string }> = {
        'Authenticity': { color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '🎭' },
        'Compassion': { color: 'bg-pink-100 text-pink-700 border-pink-300', emoji: '💝' },
        'Commitment': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '🤝' },
        'Continuous Improvement': { color: 'bg-indigo-100 text-indigo-700 border-indigo-300', emoji: '📈' },
        'Courage': { color: 'bg-red-100 text-red-700 border-red-300', emoji: '🦁' },
        'Creativity': { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', emoji: '🎨' },
        'Dependability': { color: 'bg-green-100 text-green-700 border-green-300', emoji: '⚓' },
        'Effort': { color: 'bg-orange-100 text-orange-700 border-orange-300', emoji: '💪' },
        'Hard Work': { color: 'bg-orange-100 text-orange-700 border-orange-300', emoji: '💪' },
        'Fairness': { color: 'bg-teal-100 text-teal-700 border-teal-300', emoji: '⚖️' },
        'Generosity': { color: 'bg-green-100 text-green-700 border-green-300', emoji: '🎁' },
        'Gratitude': { color: 'bg-amber-100 text-amber-700 border-amber-300', emoji: '🙏' },
        'Honesty': { color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '💎' },
        'Integrity': { color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '💎' },
        'Humility': { color: 'bg-gray-100 text-gray-700 border-gray-300', emoji: '🕊️' },
        'Open Mindedness': { color: 'bg-cyan-100 text-cyan-700 border-cyan-300', emoji: '🌈' },
        'Perseverance': { color: 'bg-red-100 text-red-700 border-red-300', emoji: '🔥' },
        'Positivity': { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', emoji: '☀️' },
        'Optimism': { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', emoji: '☀️' },
        'Proactivity': { color: 'bg-indigo-100 text-indigo-700 border-indigo-300', emoji: '🚀' },
        'Self-respect': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '👑' },
        'Tolerance': { color: 'bg-green-100 text-green-700 border-green-300', emoji: '🤲' },
        'Wisdom': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '🦉' }
    };

    // Purpose to color/emoji mapping (common purpose elements)
    const purposeStyles: Record<string, { color: string; emoji: string }> = {
        'Help Others': { color: 'bg-rose-100 text-rose-700 border-rose-300', emoji: '🤝' },
        'Help the Environment': { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', emoji: '🌍' },
        'Mentor Youth': { color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '👨🏫' },
        'Protect My Family': { color: 'bg-red-100 text-red-700 border-red-300', emoji: '🛡️' },
        'Improve Teen Financial Literacy': { color: 'bg-green-100 text-green-700 border-green-300', emoji: '💰' },
        'Develop Community': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '🏘️' },
        'Address Adult Loneliness': { color: 'bg-pink-100 text-pink-700 border-pink-300', emoji: '💕' },
        'Address Climate Change': { color: 'bg-green-100 text-green-700 border-green-300', emoji: '🌡️' },
        'Improve Cancer Treatment': { color: 'bg-pink-100 text-pink-700 border-pink-300', emoji: '🎗️' },
        'Cure Alzheimer\'s': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '🧠' },
        'Improve Medical Care': { color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '⚕️' },
        'Provide Clean Water': { color: 'bg-cyan-100 text-cyan-700 border-cyan-300', emoji: '💧' },
        'Address Homelessness': { color: 'bg-orange-100 text-orange-700 border-orange-300', emoji: '🏠' },
        'Address Racial Inequality': { color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '✊' },
        'Improve Care for the Elderly': { color: 'bg-amber-100 text-amber-700 border-amber-300', emoji: '👴' },
        'Address Food Insecurity': { color: 'bg-orange-100 text-orange-700 border-orange-300', emoji: '🍞' }
    };

    // Default style for custom/unmapped items
    const defaultStyle = { color: 'bg-gray-100 text-gray-700 border-gray-300', emoji: '⭐' };

    const getStyle = (item: string, type: 'value' | 'purpose') => {
        const map = type === 'value' ? valueStyles : purposeStyles;
        return map[item] || defaultStyle;
    };

    if (compact) {
        // Compact mode: just show count indicators
        return (
            <div className="flex items-center gap-2">
                {selectedValues.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                        <span className="text-sm">💎</span>
                        <span className="text-xs font-semibold text-blue-700">{selectedValues.length}</span>
                    </div>
                )}
                {selectedPurpose.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md border border-purple-200">
                        <span className="text-sm">🎯</span>
                        <span className="text-xs font-semibold text-purple-700">{selectedPurpose.length}</span>
                    </div>
                )}
            </div>
        );
    }

    // Full mode: show all badges
    return (
        <div className="space-y-2">
            {/* Values Section */}
            {selectedValues.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Values</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedValues.map((value) => {
                            const style = getStyle(value, 'value');
                            return (
                                <div
                                    key={value}
                                    className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                    border-2 text-xs font-semibold
                    ${style.color}
                    transition-transform hover:scale-105
                  `}
                                >
                                    <span className="text-sm">{style.emoji}</span>
                                    <span>{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Purpose Section */}
            {selectedPurpose.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Purpose</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedPurpose.map((purpose) => {
                            const style = getStyle(purpose, 'purpose');
                            return (
                                <div
                                    key={purpose}
                                    className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                    border-2 text-xs font-semibold
                    ${style.color}
                    transition-transform hover:scale-105
                  `}
                                >
                                    <span className="text-sm">{style.emoji}</span>
                                    <span>{purpose}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
