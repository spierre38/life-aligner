'use client';

type EmptyStateProps = {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
};

export default function EmptyState({
    icon = '📋',
    title,
    description,
    actionLabel,
    onAction
}: EmptyStateProps) {
    return (
        <div className="text-center py-12 px-6">
            <div className="text-6xl mb-4 animate-bounce">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
