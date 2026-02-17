'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIncompleteTodoCount } from '@/lib/todoHelpers';

import { useToast } from '@/app/components/Toast';

type DashboardTodoWidgetProps = {
    userId: string;
};

export function DashboardTodoWidget({ userId }: DashboardTodoWidgetProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [todoCount, setTodoCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    useEffect(() => {
        loadTodoCount();
    }, [userId]);

    const loadTodoCount = async () => {
        try {
            const count = await getIncompleteTodoCount(userId);
            setTodoCount(count);
        } catch (error) {
            console.error('Error loading todo count:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async () => {
        if (!newTask.trim() || adding) return;

        setAdding(true);
        try {
            const { error } = await supabase
                .from('todo_items')
                .insert({
                    user_id: userId,
                    text: newTask.trim(),
                    completed: false,
                    from_roadmap: false
                });

            if (error) throw error;

            setNewTask('');
            setJustAdded(true);
            await loadTodoCount();

            // Reset success state after 2 seconds
            setTimeout(() => setJustAdded(false), 2000);
        } catch (error) {
            console.error('Error adding task:', error);
            showToast('Failed to add task. Please try again.', 'error');
        } finally {
            setAdding(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuickAdd();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header with Count */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 border-b border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">To-Do List</h3>
                            <p className="text-sm text-gray-600">Your tasks today</p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/todo')}
                        className="text-indigo-600 hover:text-indigo-800 transition text-sm font-medium"
                    >
                        View All →
                    </button>
                </div>

                {/* Task Count */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-gray-600">Loading...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-4xl font-bold text-indigo-600">{todoCount}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {todoCount === 0 ? 'No tasks' : todoCount === 1 ? 'task to do' : 'tasks to do'}
                                </div>
                            </div>
                            {todoCount > 0 && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Keep going!</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {todoCount < 5 ? "You're almost done! 🎯" : "Stay focused! 💪"}
                                    </div>
                                </div>
                            )}
                            {todoCount === 0 && (
                                <div className="text-4xl">🎉</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Add */}
            <div className="p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quick Add Task
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="What needs to be done?"
                        disabled={adding}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 disabled:bg-gray-50"
                    />
                    <button
                        onClick={handleQuickAdd}
                        disabled={adding || !newTask.trim()}
                        className={`
              px-5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap
              ${adding || !newTask.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : justAdded
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                            }
            `}
                    >
                        {adding ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : justAdded ? (
                            <span className="flex items-center gap-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Added
                            </span>
                        ) : (
                            '+ Add'
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter to add quickly</p>

                {/* Motivational Tip */}
                {todoCount > 0 && (
                    <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-indigo-700">
                                <span className="font-semibold">Tip:</span> Break large tasks into smaller steps to make progress easier!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
