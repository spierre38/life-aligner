'use client';

import { useState, useEffect } from 'react';
import { getAllTodos, toggleTodoCompletion, toggleSubGoalCompletion, addManualTodo, addSubGoal, deleteManualTodo, updateTodoOrder, toggleTodoVisibility, TodoItem } from '@/lib/todos';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';

export default function YellowPadPage() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('My');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSubGoalModal, setShowSubGoalModal] = useState<string | null>(null);
    const [newTodoText, setNewTodoText] = useState('');
    const [newSubGoalText, setNewSubGoalText] = useState('');

    // Theme state
    const [theme, setTheme] = useState<'yellow' | 'blue' | 'green' | 'dark' | 'pink'>('yellow');

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('yellowpad-theme');
        if (saved && ['yellow', 'blue', 'green', 'dark', 'pink'].includes(saved)) {
            setTheme(saved as typeof theme);
        }
    }, []);

    const changeTheme = (newTheme: typeof theme) => {
        setTheme(newTheme);
        localStorage.setItem('yellowpad-theme', newTheme);
    };

    const themes = {
        yellow: {
            bg: '#fef9c3', text: '#111827',
            lineColor: '#94a3b8', marginColor: '#dc2626',
            accentBg: 'bg-yellow-300 hover:bg-yellow-400 border-yellow-500',
            accentText: 'text-gray-900',
            checkBorder: 'border-gray-600', checkColor: 'text-gray-800',
            hoverBg: 'hover:bg-yellow-200/50',
            label: 'Classic', preview: '#fef9c3',
            modalBg: 'bg-yellow-50 border-yellow-300',
            inputBorder: 'border-yellow-400',
        },
        blue: {
            bg: '#dbeafe', text: '#111827',
            lineColor: '#93c5fd', marginColor: '#3b82f6',
            accentBg: 'bg-blue-300 hover:bg-blue-400 border-blue-500',
            accentText: 'text-gray-900',
            checkBorder: 'border-blue-700', checkColor: 'text-blue-800',
            hoverBg: 'hover:bg-blue-200/50',
            label: 'Ocean', preview: '#dbeafe',
            modalBg: 'bg-blue-50 border-blue-300',
            inputBorder: 'border-blue-400',
        },
        green: {
            bg: '#dcfce7', text: '#111827',
            lineColor: '#86efac', marginColor: '#16a34a',
            accentBg: 'bg-green-300 hover:bg-green-400 border-green-500',
            accentText: 'text-gray-900',
            checkBorder: 'border-green-700', checkColor: 'text-green-800',
            hoverBg: 'hover:bg-green-200/50',
            label: 'Forest', preview: '#dcfce7',
            modalBg: 'bg-green-50 border-green-300',
            inputBorder: 'border-green-400',
        },
        dark: {
            bg: '#1e293b', text: '#e2e8f0',
            lineColor: '#334155', marginColor: '#6366f1',
            accentBg: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500',
            accentText: 'text-white',
            checkBorder: 'border-indigo-400', checkColor: 'text-indigo-300',
            hoverBg: 'hover:bg-slate-700/50',
            label: 'Midnight', preview: '#1e293b',
            modalBg: 'bg-slate-800 border-indigo-500',
            inputBorder: 'border-indigo-500',
        },
        pink: {
            bg: '#fce7f3', text: '#111827',
            lineColor: '#f9a8d4', marginColor: '#ec4899',
            accentBg: 'bg-pink-300 hover:bg-pink-400 border-pink-500',
            accentText: 'text-gray-900',
            checkBorder: 'border-pink-600', checkColor: 'text-pink-700',
            hoverBg: 'hover:bg-pink-200/50',
            label: 'Rose', preview: '#fce7f3',
            modalBg: 'bg-pink-50 border-pink-300',
            inputBorder: 'border-pink-400',
        },
    };

    const t = themes[theme];

    // Editing states
    const [editingTodo, setEditingTodo] = useState<string | null>(null);
    const [editingSubGoal, setEditingSubGoal] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [showHidden, setShowHidden] = useState(false);

    useEffect(() => {
        loadUserAndTodos();
    }, []);

    const loadUserAndTodos = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (profile?.full_name) {
                setUserName(profile.full_name.split(' ')[0]);
            }
        }

        loadTodos();
    };

    const loadTodos = async () => {
        setLoading(true);
        const { data, error } = await getAllTodos();

        if (error) {
            showToast.error('Failed to load todos');
        } else {
            const sorted = (data || []).sort((a, b) => {
                // 1. Active items first, completed items last
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                // 2. Within each group, sort by priority
                const aPriority = a.priority || 9999;
                const bPriority = b.priority || 9999;
                return aPriority - bPriority;
            });
            setTodos(sorted);
        }

        setLoading(false);
    };

    const handleToggle = async (todo: TodoItem) => {
        const { error } = await toggleTodoCompletion(todo.id, todo.source);
        if (error) {
            showToast.error('Failed to update');
        } else {
            loadTodos();
        }
    };

    const handleSubGoalToggle = async (todo: TodoItem, subGoalId: string) => {
        const { error } = await toggleSubGoalCompletion(todo.id, subGoalId, todo.source);
        if (error) {
            showToast.error('Failed to update');
        } else {
            loadTodos();
        }
    };

    const handleToggleVisibility = async (todo: TodoItem) => {
        if (!confirm(todo.hidden ? 'Show this on your To-Do pad again?' : 'Hide this from your To-Do pad?')) return;
        
        const { error } = await toggleTodoVisibility(todo.id, todo.source);
        if (error) {
            showToast.error('Failed to update visibility');
        } else {
            showToast.success(todo.hidden ? 'Added back to To-Do pad' : 'Hidden from To-Do pad');
            loadTodos();
        }
    };

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;

        const { error } = await addManualTodo(newTodoText.trim(), {
            priority: todos.length + 1
        });

        if (error) {
            showToast.error('Failed to add todo');
        } else {
            showToast.success('Todo added!');
            setNewTodoText('');
            setShowAddModal(false);
            loadTodos();
        }
    };

    const handleAddSubGoal = async (e: React.FormEvent, todoId: string, source: 'roadmap' | 'manual') => {
        e.preventDefault();
        if (!newSubGoalText.trim()) return;

        const { error } = await addSubGoal(todoId, newSubGoalText.trim(), source);

        if (error) {
            showToast.error('Failed to add sub-goal');
        } else {
            showToast.success('Sub-goal added!');
            setNewSubGoalText('');
            setShowSubGoalModal(null);
            loadTodos();
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        // Only active items are in the drag context
        const active = todos.filter(t => !t.completed);
        const completed = todos.filter(t => t.completed);
        const [reorderedItem] = active.splice(result.source.index, 1);
        active.splice(result.destination.index, 0, reorderedItem);

        const reorderedActive = active.map((item, index) => ({
            ...item,
            priority: index + 1
        }));

        const merged = [...reorderedActive, ...completed];
        setTodos(merged);
        updateTodoOrder(merged);
    };

    const handleSubGoalDragEnd = (result: any, todoId: string) => {
        if (!result.destination) return;

        const todo = todos.find(t => t.id === todoId);
        if (!todo || !todo.sub_goals) return;

        const subGoals = Array.from(todo.sub_goals);
        const [reorderedSubGoal] = subGoals.splice(result.source.index, 1);
        subGoals.splice(result.destination.index, 0, reorderedSubGoal);

        // Update the todo with new sub-goal order
        updateSubGoalOrder(todoId, todo.source, subGoals);
    };

    const updateSubGoalOrder = async (todoId: string, source: 'roadmap' | 'manual', newSubGoals: any[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roadmapEntry } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (!roadmapEntry) return;

        const content = roadmapEntry.content;

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return { ...activity, sub_goals: newSubGoals };
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return { ...todo, sub_goals: newSubGoals };
                }
                return todo;
            });
        }

        await supabase
            .from('workbook_entries')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        loadTodos();
    };

    const startEditingTodo = (todo: TodoItem) => {
        setEditingTodo(todo.id);
        setEditText(todo.text);
    };

    const startEditingSubGoal = (subGoalId: string, text: string) => {
        setEditingSubGoal(subGoalId);
        setEditText(text);
    };

    const saveEditTodo = async (todoId: string, source: 'roadmap' | 'manual') => {
        if (!editText.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roadmapEntry } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (!roadmapEntry) return;

        const content = roadmapEntry.content;

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return { ...activity, text: editText.trim() };
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return { ...todo, text: editText.trim() };
                }
                return todo;
            });
        }

        await supabase
            .from('workbook_entries')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        setEditingTodo(null);
        setEditText('');
        loadTodos();
        showToast.success('Updated!');
    };

    const saveEditSubGoal = async (todoId: string, subGoalId: string, source: 'roadmap' | 'manual') => {
        if (!editText.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roadmapEntry } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (!roadmapEntry) return;

        const content = roadmapEntry.content;

        const updateSubGoal = (todo: any) => {
            if (todo.sub_goals) {
                todo.sub_goals = todo.sub_goals.map((sg: any) =>
                    sg.id === subGoalId ? { ...sg, text: editText.trim() } : sg
                );
            }
            return todo;
        };

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return updateSubGoal(activity);
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return updateSubGoal(todo);
                }
                return todo;
            });
        }

        await supabase
            .from('workbook_entries')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        setEditingSubGoal(null);
        setEditText('');
        loadTodos();
        showToast.success('Updated!');
    };

    const deleteSubGoal = async (todoId: string, subGoalId: string, source: 'roadmap' | 'manual') => {
        if (!confirm('Delete this sub-goal?')) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roadmapEntry } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (!roadmapEntry) return;

        const content = roadmapEntry.content;

        const removeSubGoal = (todo: any) => {
            if (todo.sub_goals) {
                todo.sub_goals = todo.sub_goals.filter((sg: any) => sg.id !== subGoalId);
            }
            return todo;
        };

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return removeSubGoal(activity);
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return removeSubGoal(todo);
                }
                return todo;
            });
        }

        await supabase
            .from('workbook_entries')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        loadTodos();
        showToast.success('Deleted!');
    };

    const getSubGoalLabel = (priority: number, subIndex: number) => {
        return `${priority}${String.fromCharCode(97 + subIndex)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: t.marginColor, borderTopColor: 'transparent' }}></div>
                    <p className="text-lg" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                        Loading your pad...
                    </p>
                </div>
            </div>
        );
    }

    // Separate active, completed, and hidden for rendering
    const visibleTodos = todos.filter(todo => !todo.hidden);
    const activeTodos = visibleTodos.filter(todo => !todo.completed);
    const completedTodos = visibleTodos.filter(todo => todo.completed);
    const hiddenTodos = todos.filter(todo => todo.hidden);

    return (
        <>
            {/* FULL PAGE PAD */}
            <div
                className="min-h-screen relative"
                style={{
                    backgroundColor: t.bg,
                    color: t.text,
                    backgroundImage: `
                        repeating-linear-gradient(
                            transparent,
                            transparent 31px,
                            ${t.lineColor} 31px,
                            ${t.lineColor} 32px
                        ),
                        linear-gradient(90deg, transparent 0px, transparent 80px, ${t.marginColor} 80px, ${t.marginColor} 82px, transparent 82px)
                    `,
                    lineHeight: '32px'
                }}
            >
                {/* Header Area */}
                <div className="pl-28 pr-8 pt-3 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-1 font-bold text-sm mb-2 transition-colors opacity-70 hover:opacity-100"
                                style={{ fontFamily: 'Courier New, monospace', color: t.text }}
                            >
                                ← DASHBOARD
                            </Link>
                            <h1
                                className="text-5xl font-bold mb-1"
                                style={{ fontFamily: 'Courier New, monospace', lineHeight: '1.2', color: t.text }}
                            >
                                {userName}'s Pad
                            </h1>
                            <p className="font-semibold mb-1" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                                <span className="font-bold" style={{ color: '#2563eb' }}>Blue</span> = Roadmap •
                                <span className="font-bold ml-2" style={{ color: '#15803d' }}>Green</span> = Manual
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Theme Switcher */}
                            <div className="flex items-center gap-1.5 bg-white/30 p-1.5 rounded-lg backdrop-blur-sm border border-white/20">
                                {(Object.keys(themes) as Array<keyof typeof themes>).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => changeTheme(key)}
                                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                                            theme === key
                                                ? 'ring-2 ring-offset-1 ring-gray-500 scale-110'
                                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: themes[key].preview, borderColor: themes[key].marginColor }}
                                        title={themes[key].label}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className={`px-6 py-3 border-2 rounded-lg font-bold shadow-md transition-all ${t.accentBg} ${t.accentText}`}
                                style={{ fontFamily: 'Courier New, monospace' }}
                            >
                                ✏️ ADD TODO
                            </button>
                        </div>
                    </div>
                </div>

                {/* Yellow Pad Content */}
                <div className="pl-28 pr-8 pb-16">
                    {todos.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="text-9xl mb-6">📝</div>
                            <h2 className="text-4xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Courier New, monospace' }}>
                                Empty Pad
                            </h2>
                            <p className="text-xl text-gray-600 mb-8" style={{ fontFamily: 'Courier New, monospace' }}>
                                Click "ADD TODO" to get started
                            </p>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="todos">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {activeTodos.map((todo, index) => (
                                            <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`transition-opacity ${snapshot.isDragging ? 'opacity-75' : ''}`}
                                                    >
                                                        {/* Main Todo */}
                                                        <div
                                                            className="flex items-center gap-4 group"
                                                            style={{
                                                                minHeight: '32px',
                                                                lineHeight: '32px',
                                                                paddingTop: '0px',
                                                                paddingBottom: '0px'
                                                            }}
                                                        >
                                                            {/* Drag Handle */}
                                                            <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-move">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                                </svg>
                                                            </div>

                                                            {/* Priority Number */}
                                                            <div
                                                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                                                                style={{
                                                                    backgroundColor: (index + 1) <= 3 ? '#ef4444' : (index + 1) <= 6 ? '#f97316' : '#6b7280'
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </div>

                                                            {/* Checkbox */}
                                                            <button
                                                                onClick={() => handleToggle(todo)}
                                                                className={`w-5 h-5 rounded border-2 flex-shrink-0 hover:opacity-80 transition-colors ${t.checkBorder}`}
                                                            >
                                                                {todo.completed && (
                                                                    <svg className="w-full h-full text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>

                                                            {/* Todo Text (Editable) */}
                                                            {editingTodo === todo.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    onBlur={() => saveEditTodo(todo.id, todo.source)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') saveEditTodo(todo.id, todo.source);
                                                                        if (e.key === 'Escape') { setEditingTodo(null); setEditText(''); }
                                                                    }}
                                                                    className="flex-1 bg-white border-2 border-yellow-500 rounded px-2 text-gray-900"
                                                                    style={{ fontFamily: 'Courier New, monospace', fontSize: '18px', height: '28px' }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span
                                                                    onClick={() => startEditingTodo(todo)}
                                                                    className={`text-lg flex-1 cursor-pointer ${t.hoverBg} px-1 rounded ${todo.completed ? 'line-through opacity-50' : ''}`}
                                                                    style={{
                                                                        fontFamily: 'Courier New, monospace',
                                                                        color: todo.completed
                                                                            ? (theme === 'dark' ? '#64748b' : '#9ca3af')
                                                                            : todo.source === 'roadmap' ? '#2563eb' : '#15803d'
                                                                    }}
                                                                >
                                                                    {todo.text}
                                                                </span>
                                                            )}

                                                            {/* Hide Button (for non-completed items) */}
                                                            <button
                                                                onClick={() => handleToggleVisibility(todo)}
                                                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 rounded text-xs font-bold transition-all ml-2"
                                                                style={{ fontFamily: 'Courier New, monospace' }}
                                                                title="Hide from To-Do Pad"
                                                            >
                                                                hide
                                                            </button>

                                                            {/* Add Sub-Goal Button */}
                                                            <button
                                                                onClick={() => setShowSubGoalModal(todo.id)}
                                                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 rounded text-xs font-bold transition-all"
                                                                style={{ fontFamily: 'Courier New, monospace' }}
                                                            >
                                                                + sub
                                                            </button>

                                                            {/* Delete Button (manual todos only) */}
                                                            {todo.source === 'manual' && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('Delete this task?')) {
                                                                            deleteManualTodo(todo.id).then(() => loadTodos());
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {/* Due Date */}
                                                            {todo.due_date && !todo.completed && (
                                                                <span className="text-xs text-gray-600" style={{ fontFamily: 'Courier New, monospace' }}>
                                                                    {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sub-Goals (Draggable) */}
                                                        {todo.sub_goals && todo.sub_goals.length > 0 && (
                                                            <DragDropContext onDragEnd={(result) => handleSubGoalDragEnd(result, todo.id)}>
                                                                <Droppable droppableId={`subgoals-${todo.id}`}>
                                                                    {(provided) => (
                                                                        <div
                                                                            {...provided.droppableProps}
                                                                            ref={provided.innerRef}
                                                                            className="ml-20"
                                                                        >
                                                                            {todo.sub_goals?.map((subGoal, subIndex) => (
                                                                                <Draggable key={subGoal.id} draggableId={subGoal.id} index={subIndex}>
                                                                                    {(provided, snapshot) => (
                                                                                        <div
                                                                                            ref={provided.innerRef}
                                                                                            {...provided.draggableProps}
                                                                                            className={`flex items-center gap-4 group/sub ${snapshot.isDragging ? 'opacity-75' : ''}`}
                                                                                            style={{
                                                                                                minHeight: '32px',
                                                                                                lineHeight: '32px',
                                                                                                paddingTop: '0px',
                                                                                                paddingBottom: '0px',
                                                                                                ...provided.draggableProps.style
                                                                                            }}
                                                                                        >
                                                                                            {/* Drag Handle */}
                                                                                            <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-move">
                                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                                                                </svg>
                                                                                            </div>

                                                                                            {/* Sub-Goal Label */}
                                                                                            <span
                                                                                                className="text-sm font-bold text-gray-500 w-6"
                                                                                                style={{ fontFamily: 'Courier New, monospace' }}
                                                                                            >
                                                                                                {getSubGoalLabel(index + 1, subIndex)}
                                                                                            </span>

                                                                                            {/* Checkbox */}
                                                                                            <button
                                                                                                onClick={() => handleSubGoalToggle(todo, subGoal.id)}
                                                                                                className="w-4 h-4 rounded border-2 border-gray-500 flex-shrink-0 hover:border-gray-700"
                                                                                            >
                                                                                                {subGoal.completed && (
                                                                                                    <svg className="w-full h-full text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                                    </svg>
                                                                                                )}
                                                                                            </button>

                                                                                            {/* Sub-Goal Text (Editable) */}
                                                                                            {editingSubGoal === subGoal.id ? (
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={editText}
                                                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                                                    onBlur={() => saveEditSubGoal(todo.id, subGoal.id, todo.source)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === 'Enter') saveEditSubGoal(todo.id, subGoal.id, todo.source);
                                                                                                        if (e.key === 'Escape') { setEditingSubGoal(null); setEditText(''); }
                                                                                                    }}
                                                                                                    className="flex-1 bg-white border-2 border-yellow-500 rounded px-2 text-gray-900"
                                                                                                    style={{ fontFamily: 'Courier New, monospace', fontSize: '16px', height: '24px' }}
                                                                                                    autoFocus
                                                                                                />
                                                                                            ) : (
                                                                                                <span
                                                                                                    onClick={() => startEditingSubGoal(subGoal.id, subGoal.text)}
                                                                                                    className={`text-base flex-1 cursor-pointer hover:bg-yellow-200/50 px-1 rounded ${subGoal.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}
                                                                                                    style={{ fontFamily: 'Courier New, monospace' }}
                                                                                                >
                                                                                                    {subGoal.text}
                                                                                                </span>
                                                                                            )}

                                                                                            {/* Delete Sub-Goal Button */}
                                                                                            <button
                                                                                                onClick={() => deleteSubGoal(todo.id, subGoal.id, todo.source)}
                                                                                                className="opacity-0 group-hover/sub:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                                                                                            >
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                                </svg>
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </Draggable>
                                                                            ))}
                                                                            {provided.placeholder}
                                                                        </div>
                                                                    )}
                                                                </Droppable>
                                                            </DragDropContext>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {/* Completed Section */}
                    {completedTodos.length > 0 && (
                        <div className="mt-8">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
                                style={{ fontFamily: 'Courier New, monospace' }}
                            >
                                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: t.marginColor + '60' }} />
                                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: t.text }}>
                                    {showCompleted ? '▼' : '▶'} {completedTodos.length} completed
                                </span>
                                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: t.marginColor + '60' }} />
                            </button>

                            {showCompleted && (
                                <div className="mt-4 space-y-0 opacity-50">
                                    {completedTodos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className="flex items-center gap-4 group"
                                            style={{
                                                minHeight: '32px',
                                                lineHeight: '32px',
                                            }}
                                        >
                                            {/* Spacer for drag handle */}
                                            <div className="w-4" />

                                            {/* Completed ✓ badge */}
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-green-500"
                                            >
                                                ✓
                                            </div>

                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleToggle(todo)}
                                                className={`w-5 h-5 rounded border-2 flex-shrink-0 ${t.checkBorder}`}
                                            >
                                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>

                                            {/* Todo Text */}
                                            <span
                                                className="text-base flex-1 line-through"
                                                style={{
                                                    fontFamily: 'Courier New, monospace',
                                                    color: theme === 'dark' ? '#475569' : '#9ca3af'
                                                }}
                                            >
                                                {todo.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hidden Section */}
                    {hiddenTodos.length > 0 && (
                        <div className="mt-8 mb-8">
                            <button
                                onClick={() => setShowHidden(!showHidden)}
                                className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
                                style={{ fontFamily: 'Courier New, monospace' }}
                            >
                                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: t.marginColor + '60' }} />
                                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: t.text }}>
                                    {showHidden ? '▼' : '▶'} {hiddenTodos.length} hidden
                                </span>
                                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: t.marginColor + '60' }} />
                            </button>

                            {showHidden && (
                                <div className="mt-4 space-y-0 opacity-60">
                                    {hiddenTodos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className="flex items-center gap-4 group"
                                            style={{
                                                minHeight: '32px',
                                                lineHeight: '32px',
                                            }}
                                        >
                                            {/* Spacer */}
                                            <div className="w-12 h-8" />

                                            {/* Todo Text */}
                                            <span
                                                className="text-base flex-1"
                                                style={{
                                                    fontFamily: 'Courier New, monospace',
                                                    color: theme === 'dark' ? '#94a3b8' : '#6b7280'
                                                }}
                                            >
                                                {todo.text}
                                                <span className="text-xs ml-2 italic">({todo.source === 'roadmap' ? 'Roadmap Goal' : 'Manual'})</span>
                                            </span>

                                            {/* Unhide Button */}
                                            <button
                                                onClick={() => handleToggleVisibility(todo)}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-xs font-bold transition-all text-gray-800"
                                                style={{ fontFamily: 'Courier New, monospace' }}
                                                title="Show on To-Do Pad"
                                            >
                                                unhide
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Paper Shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-400/20 to-transparent pointer-events-none" />
            </div>

            {/* Add Todo Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 ${t.modalBg}`}>
                        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                            Add New Todo
                        </h2>
                        <form onSubmit={handleAddTodo}>
                            <input
                                type="text"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                placeholder="What do you need to do?"
                                className={`w-full px-4 py-3 border-2 rounded-xl ${t.inputBorder}`}
                                style={{ fontFamily: 'Courier New, monospace', backgroundColor: theme === 'dark' ? '#1e293b' : 'white', color: t.text }}
                                autoFocus
                                required
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-400 rounded-xl font-bold hover:opacity-80"
                                    style={{ fontFamily: 'Courier New, monospace', color: t.text, backgroundColor: theme === 'dark' ? '#334155' : 'white' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 border-2 rounded-xl font-bold ${t.accentBg} ${t.accentText}`}
                                    style={{ fontFamily: 'Courier New, monospace' }}
                                >
                                    Add Todo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Sub-Goal Modal */}
            {showSubGoalModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 ${t.modalBg}`}>
                        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                            Add Sub-Goal
                        </h2>
                        <form onSubmit={(e) => {
                            const todo = todos.find(t => t.id === showSubGoalModal);
                            if (todo) handleAddSubGoal(e, todo.id, todo.source);
                        }}>
                            <input
                                type="text"
                                value={newSubGoalText}
                                onChange={(e) => setNewSubGoalText(e.target.value)}
                                placeholder="Enter sub-goal..."
                                className={`w-full px-4 py-3 border-2 rounded-xl ${t.inputBorder}`}
                                style={{ fontFamily: 'Courier New, monospace', backgroundColor: theme === 'dark' ? '#1e293b' : 'white', color: t.text }}
                                autoFocus
                                required
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSubGoalModal(null)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-400 rounded-xl font-bold hover:opacity-80"
                                    style={{ fontFamily: 'Courier New, monospace', color: t.text, backgroundColor: theme === 'dark' ? '#334155' : 'white' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 border-2 rounded-xl font-bold ${t.accentBg} ${t.accentText}`}
                                    style={{ fontFamily: 'Courier New, monospace' }}
                                >
                                    Add Sub-Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}