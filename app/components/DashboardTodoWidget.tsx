'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTodos, addManualTodo, toggleTodoCompletion, TodoItem } from '@/lib/todos';
import { useToast } from '@/app/components/Toast';

type DashboardTodoWidgetProps = {
    userId: string;
};

export function DashboardTodoWidget({ userId }: DashboardTodoWidgetProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        loadTodos();
    }, [userId]);

    const loadTodos = async () => {
        try {
            const { data, error } = await getAllTodos();
            if (error) throw error;
            // Sort by priority, keep incomplete first
            const sorted = (data || []).sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return (a.priority ?? 999) - (b.priority ?? 999);
            });
            setTodos(sorted);
        } catch (error) {
            console.error('Error loading todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (todo: TodoItem) => {
        setTogglingId(todo.id);
        try {
            const { error } = await toggleTodoCompletion(todo.id, todo.source);
            if (error) throw error;
            await loadTodos();
        } catch {
            showToast('Failed to update task', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleQuickAdd = async () => {
        if (!newTask.trim() || adding) return;
        setAdding(true);
        try {
            // Use current incomplete count + 1 for proper priority ordering
            const incompletCount = todos.filter(t => !t.completed).length;
            const { error } = await addManualTodo(newTask.trim(), {
                priority: incompletCount + 1
            });
            if (error) throw error;
            setNewTask('');
            setJustAdded(true);
            await loadTodos();
            setTimeout(() => setJustAdded(false), 2000);
        } catch {
            showToast('Failed to add task. Please try again.', 'error');
        } finally {
            setAdding(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuickAdd();
        }
    };

    const incompleteTodos = todos.filter(t => !t.completed);
    const completedToday = todos.filter(t => t.completed).length;
    const preview = incompleteTodos.slice(0, 5);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
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
                            <p className="text-sm text-gray-600">
                                {incompleteTodos.length === 0
                                    ? completedToday > 0 ? `${completedToday} done today 🎉` : 'All clear!'
                                    : `${incompleteTodos.length} task${incompleteTodos.length !== 1 ? 's' : ''} remaining`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/todo')}
                        className="text-indigo-600 hover:text-indigo-800 transition text-sm font-semibold"
                    >
                        View All →
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div className="px-6 pt-4 pb-2">
                {loading ? (
                    <div className="space-y-3 py-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-5 h-5 rounded bg-gray-200 flex-shrink-0" />
                                <div className="h-4 bg-gray-200 rounded flex-1" />
                            </div>
                        ))}
                    </div>
                ) : incompleteTodos.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-4xl mb-2">🎉</div>
                        <p className="text-gray-500 text-sm font-medium">
                            {completedToday > 0 ? `${completedToday} tasks completed today!` : 'No tasks yet — add one below!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {preview.map((todo) => (
                            <div key={todo.id} className="flex items-center gap-3 py-2 group">
                                {/* Checkbox */}
                                <button
                                    onClick={() => handleToggle(todo)}
                                    disabled={togglingId === todo.id}
                                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                                        ${todo.completed
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-gray-400 hover:border-indigo-500'
                                        }
                                        ${togglingId === todo.id ? 'opacity-50' : ''}
                                    `}
                                >
                                    {todo.completed && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Text */}
                                <span
                                    className={`flex-1 text-sm leading-tight cursor-pointer hover:text-indigo-600 transition-colors
                                        ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}
                                    `}
                                    onClick={() => router.push('/todo')}
                                >
                                    {todo.text}
                                </span>

                                {/* Source badge */}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                                    ${todo.source === 'roadmap' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'}
                                `}>
                                    {todo.source === 'roadmap' ? 'Roadmap' : 'Manual'}
                                </span>
                            </div>
                        ))}

                        {/* More indicator */}
                        {incompleteTodos.length > 5 && (
                            <button
                                onClick={() => router.push('/todo')}
                                className="w-full text-center text-xs text-gray-400 hover:text-indigo-600 py-2 transition-colors font-medium"
                            >
                                +{incompleteTodos.length - 5} more tasks — view all →
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Add */}
            <div className="px-6 pb-6 pt-3 border-t border-gray-100 mt-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Quick Add
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What needs to be done?"
                        disabled={adding}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 transition-colors"
                    />
                    <button
                        onClick={handleQuickAdd}
                        disabled={adding || !newTask.trim()}
                        className={`
                            px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1
                            ${adding || !newTask.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : justAdded
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                            }
                        `}
                    >
                        {adding ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : justAdded ? (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Added!
                            </>
                        ) : '+ Add'}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Press Enter to add · Tasks also appear on <button onClick={() => router.push('/todo')} className="text-indigo-500 hover:underline">Yellow Pad</button></p>
            </div>
        </div>
    );
}
