'use client';

import { useState } from 'react';
import { addRoadmapActivityToTodo, RoadmapContext } from '@/lib/todoHelpers';

type AddToTodoButtonProps = {
    userId: string;
    activity: string;
    context: RoadmapContext;
    variant?: 'default' | 'compact';
};

export function AddToTodoButton({
    userId,
    activity,
    context,
    variant = 'default'
}: AddToTodoButtonProps) {
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        setAdding(true);
        setError(null);

        const result = await addRoadmapActivityToTodo(userId, activity, context);

        if (result.success) {
            setAdded(true);
            // Reset after 2 seconds
            setTimeout(() => setAdded(false), 2000);
        } else {
            setError(result.error || 'Failed to add');
            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
        }

        setAdding(false);
    };

    if (variant === 'compact') {
        return (
            <button
                onClick={handleAdd}
                disabled={adding || added}
                className={`
          flex items-center gap-1 text-xs font-medium transition-all
          ${added
                        ? 'text-green-600 cursor-default'
                        : error
                            ? 'text-red-600'
                            : 'text-indigo-600 hover:text-indigo-800'
                    }
        `}
                title={error || (added ? 'Added to To-Do List!' : 'Add to To-Do List')}
            >
                {adding ? (
                    <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Adding...</span>
                    </>
                ) : added ? (
                    <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Added!</span>
                    </>
                ) : error ? (
                    <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>Error</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>To-Do</span>
                    </>
                )}
            </button>
        );
    }

    // Default variant
    return (
        <button
            onClick={handleAdd}
            disabled={adding || added}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${added
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : error
                        ? 'bg-red-100 text-red-700'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-md'
                }
      `}
        >
            {adding ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Adding...</span>
                </>
            ) : added ? (
                <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Added to To-Do List!</span>
                </>
            ) : error ? (
                <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Add to To-Do List</span>
                </>
            )}
        </button>
    );
}
