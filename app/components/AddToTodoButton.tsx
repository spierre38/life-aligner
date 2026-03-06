'use client';

import { useRouter } from 'next/navigation';

type AddToTodoButtonProps = {
    variant?: 'default' | 'compact';
};

export function AddToTodoButton({
    variant = 'default'
}: AddToTodoButtonProps) {
    const router = useRouter();

    if (variant === 'compact') {
        return (
            <button
                onClick={() => router.push('/todo')}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-all"
                title="View in To-Do List"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Todos</span>
            </button>
        );
    }

    // Default variant
    return (
        <button
            onClick={() => router.push('/todo')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-md transition-all"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>View in To-Do List</span>
        </button>
    );
}
