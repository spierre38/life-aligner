'use client';

import { trackTodoCreated, trackTodoCompleted } from '@/lib/analytics';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { clearCompletedTodos } from '@/lib/todoHelpers';
import AuthNavbar from '@/app/components/AuthNavbar';
import { EmptyState } from '@/app/components/EmptyState';

import { useToast } from '@/app/components/Toast';
import { SkeletonCard } from '@/app/components/Skeleton';

type TodoItem = {
    id: string;
    text: string;
    completed: boolean;
    from_roadmap: boolean;
    roadmap_context?: {
        life_category?: string;
        goal?: string;
        activity?: string;
    };
    created_at: string;
    completed_at?: string;
};

export default function TodoListPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodoText, setNewTodoText] = useState('');
    const [addingTodo, setAddingTodo] = useState(false);
    const [clearingCompleted, setClearingCompleted] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        const checkAuthAndLoadTodos = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUserId(userWithProfile.user.id);
                await loadTodos(userWithProfile.user.id);
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndLoadTodos();
    }, [router]);

    const loadTodos = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('todo_items')
                .select('*')
                .eq('user_id', uid)
                .order('completed', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    };

    const addTodo = async () => {
        if (!userId || !newTodoText.trim()) return;

        setAddingTodo(true);
        try {
            const { error } = await supabase
                .from('todo_items')
                .insert({
                    user_id: userId,
                    text: newTodoText.trim(),
                    completed: false,
                    from_roadmap: false
                });

            if (error) throw error;

            trackTodoCreated('manual');
            setNewTodoText('');
            await loadTodos(userId);
            showToast('Task added successfully!', 'success');
        } catch (error) {
            console.error('Error adding todo:', error);
            showToast('Failed to add todo. Please try again.', 'error');
        } finally {
            setAddingTodo(false);
        }
    };

    const toggleComplete = async (todo: TodoItem) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('todo_items')
                .update({
                    completed: !todo.completed,
                    completed_at: !todo.completed ? new Date().toISOString() : null
                })
                .eq('id', todo.id);

            if (error) throw error;
            if (!todo.completed) {
                trackTodoCompleted();
                showToast('Task completed! 🎉', 'success');
            }
            await loadTodos(userId);
        } catch (error) {
            console.error('Error toggling todo:', error);
            showToast('Failed to update task.', 'error');
        }
    };

    const deleteTodo = async (todoId: string) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('todo_items')
                .delete()
                .eq('id', todoId);

            if (error) throw error;
            await loadTodos(userId);
            showToast('Task deleted.', 'success');
        } catch (error) {
            console.error('Error deleting todo:', error);
            showToast('Failed to delete task.', 'error');
        }
    };

    const handleClearCompleted = async () => {
        if (!userId) return;

        setClearingCompleted(true);
        try {
            const result = await clearCompletedTodos(userId);
            if (result.success) {
                await loadTodos(userId);
                setShowClearConfirm(false);
                showToast('Cleared all completed tasks.', 'success');
            }
        } catch (error) {
            console.error('Error clearing completed:', error);
            showToast('Failed to clear completed tasks.', 'error');
        } finally {
            setClearingCompleted(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTodo();
        }
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-24">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="space-y-6">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const incompleteTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);
    const roadmapTodos = incompleteTodos.filter(t => t.from_roadmap);
    const dailyTodos = incompleteTodos.filter(t => !t.from_roadmap);

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 pt-16">
                    <div className="absolute inset-0 bg-[url('/backgrounds/todo-bg.png')] bg-cover bg-center opacity-[0.08]"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6 group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">To-Do List</h1>
                                    <p className="text-gray-600">Your daily tasks and goals</p>
                                </div>
                            </div>

                            {/* Clear Completed Button */}
                            {completedTodos.length > 0 && (
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-600 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="hidden sm:inline">Clear Completed</span>
                                </button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:shadow-lg transition">
                                <div className="text-2xl font-bold text-indigo-600">{incompleteTodos.length}</div>
                                <div className="text-sm text-gray-600">To Do</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:shadow-lg transition">
                                <div className="text-2xl font-bold text-green-600">{completedTodos.length}</div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:shadow-lg transition">
                                <div className="text-2xl font-bold text-purple-600">{roadmapTodos.length}</div>
                                <div className="text-sm text-gray-600">From Roadmap</div>
                            </div>
                        </div>
                    </div>

                    {/* Clear Completed Confirmation Modal */}
                    {showClearConfirm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Completed Tasks?</h3>
                                        <p className="text-gray-600 text-sm">
                                            This will permanently delete {completedTodos.length} completed {completedTodos.length === 1 ? 'task' : 'tasks'}.
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        disabled={clearingCompleted}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleClearCompleted}
                                        disabled={clearingCompleted}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-300"
                                    >
                                        {clearingCompleted ? 'Clearing...' : 'Clear All'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tim's Yellow Pad Philosophy */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8 hover:shadow-lg transition">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-2">Tim's Yellow Pad Philosophy</h3>
                                <p className="text-sm text-gray-700 mb-3">
                                    "I've been making To-Do Lists on yellow pads for decades. I create a new one every 2-3 days when most items are crossed out.
                                    Keep it simple: everyday tasks like 'grocery shop' and 'haircut', plus Activities from your Roadmap."
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>Pro tip: Add activities from your Roadmap using the "Add to To-Do List" buttons!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add New Todo */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Task</h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="What needs to get done?"
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900"
                                disabled={addingTodo}
                            />
                            <button
                                onClick={addTodo}
                                disabled={addingTodo || !newTodoText.trim()}
                                className={`
                  px-6 py-3 rounded-xl font-semibold transition-all
                  ${addingTodo || !newTodoText.trim()
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                                    }
                `}
                            >
                                {addingTodo ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    '+ Add'
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Press Enter to add quickly</p>
                    </div>

                    {/* From Roadmap Section */}
                    {roadmapTodos.length > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border-2 border-purple-200 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <h2 className="text-lg font-bold text-gray-900">From Roadmap</h2>
                                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                                    {roadmapTodos.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {roadmapTodos.map(todo => (
                                    <TodoItemComponent
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={toggleComplete}
                                        onDelete={deleteTodo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily Tasks Section */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <h2 className="text-lg font-bold text-gray-900">Daily Tasks</h2>
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">
                                {dailyTodos.length}
                            </span>
                        </div>
                        {dailyTodos.length > 0 ? (
                            <div className="space-y-2">
                                {dailyTodos.map(todo => (
                                    <TodoItemComponent
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={toggleComplete}
                                        onDelete={deleteTodo}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No daily tasks yet"
                                description="Add one above or check your Roadmap for activities to add!"
                                illustration="todo"
                            />
                        )}
                    </div>

                    {/* Completed Section */}
                    {completedTodos.length > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-green-200 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <h2 className="text-lg font-bold text-gray-900">Completed</h2>
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                    {completedTodos.length}
                                </span>
                            </div>
                            <div className="space-y-2 opacity-70">
                                {completedTodos.map(todo => (
                                    <TodoItemComponent
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={toggleComplete}
                                        onDelete={deleteTodo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// Todo Item Component
function TodoItemComponent({
    todo,
    onToggle,
    onDelete
}: {
    todo: TodoItem;
    onToggle: (todo: TodoItem) => void;
    onDelete: (id: string) => void;
}) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <div
            className={`
        group flex items-start gap-3 p-3 rounded-xl transition-all
        ${todo.completed
                    ? 'bg-gray-50 hover:bg-gray-100'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:shadow-md'
                }
      `}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            {/* Checkbox */}
            <button
                onClick={() => onToggle(todo)}
                className={`
          flex-shrink-0 w-6 h-6 rounded-md border-2 transition-all mt-0.5
          ${todo.completed
                        ? 'bg-green-500 border-green-500 scale-110'
                        : 'border-gray-300 hover:border-indigo-500 hover:scale-110'
                    }
        `}
            >
                {todo.completed && (
                    <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className={`
          text-gray-900
          ${todo.completed ? 'line-through text-gray-500' : ''}
        `}>
                    {todo.text}
                </p>

                {/* Roadmap Context */}
                {todo.from_roadmap && todo.roadmap_context && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-purple-700 bg-purple-50 rounded px-2 py-1 inline-flex">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                            {todo.roadmap_context.life_category}: {todo.roadmap_context.goal}
                        </span>
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={() => onDelete(todo.id)}
                className={`
          flex-shrink-0 transition-all p-1 rounded-lg
          ${showDelete || todo.completed ? 'opacity-100' : 'opacity-0 sm:opacity-0'}
          text-gray-400 hover:text-red-600 hover:bg-red-50
        `}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
