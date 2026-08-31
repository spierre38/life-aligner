'use client';

import { useState, useEffect } from 'react';
import { getAllTodos, toggleTodoCompletion, toggleSubGoalCompletion, addManualTodo, addSubGoal, deleteManualTodo, updateTodoOrder, toggleTodoVisibility, editTodoText, editSubGoalText, deleteSubGoalFromTodo, reorderSubGoals, type TodoItem } from '@/lib/todos';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';
import AuthNavbar from '@/app/components/AuthNavbar';

export default function DesktopTodoPad() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('My');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSubGoalModal, setShowSubGoalModal] = useState<string | null>(null);
    const [newTodoText, setNewTodoText] = useState('');
    const [newTodoType, setNewTodoType] = useState<'one-time' | 'daily'>('one-time');
    const [newTodoDueDate, setNewTodoDueDate] = useState('');
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
    const [groupByGoal, setGroupByGoal] = useState(false);

    // Load groupByGoal from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('todopad-group-by-goal');
        if (saved === 'true') setGroupByGoal(true);
    }, []);

    const toggleGroupByGoal = () => {
        setGroupByGoal(prev => {
            const next = !prev;
            localStorage.setItem('todopad-group-by-goal', String(next));
            return next;
        });
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = ['Priority', 'Task', 'Source', 'Status', 'Sub-Goals'];
        const rows = todos.map((todo, idx) => {
            const subGoals = (todo.sub_goals || []).map(sg => sg.text).join('; ');
            return [
                String(idx + 1),
                todo.text,
                todo.source || 'manual',
                todo.completed ? 'Completed' : 'Active',
                subGoals
            ];
        });
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todo-list-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast.success('Exported to CSV!');
    };

    // Clear completed items
    const clearCompleted = async () => {
        const completedTodos = todos.filter(t => t.completed);
        if (completedTodos.length === 0) return;
        for (const todo of completedTodos) {
            if (todo.source === 'manual' || !todo.source) {
                await deleteManualTodo(todo.id);
            } else {
                await toggleTodoVisibility(todo.id, (todo.source as 'roadmap' | 'manual') || 'roadmap');
            }
        }
        setTodos(prev => prev.filter(t => !t.completed));
        showToast.success(`Cleared ${completedTodos.length} completed items`);
    };

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
                // Sort only by priority — completed items stay in place
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
            priority: todos.length + 1,
            taskType: newTodoType,
            ...(newTodoType === 'one-time' && newTodoDueDate ? { due_date: newTodoDueDate } : {}),
        });

        if (error) {
            showToast.error('Failed to add todo');
        } else {
            showToast.success(newTodoType === 'daily' ? 'Behavior change added! 🔁' : 'Todo added!');
            setNewTodoText('');
            setNewTodoType('one-time');
            setNewTodoDueDate('');
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

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const visible = Array.from(todos.filter(t => !t.hidden));
        const hidden = todos.filter(t => t.hidden);
        const [reorderedItem] = visible.splice(result.source.index, 1);
        visible.splice(result.destination.index, 0, reorderedItem);

        const reordered = visible.map((item, index) => ({
            ...item,
            priority: index + 1
        }));

        const merged = [...reordered, ...hidden];
        setTodos(merged);
        const { error } = await updateTodoOrder(merged);
        if (error) showToast.error('Failed to save order. Refresh to restore.');
    };

    const handleSubGoalDragEnd = async (result: any, todoId: string) => {
        if (!result.destination) return;

        const todo = todos.find(t => t.id === todoId);
        if (!todo || !todo.sub_goals) return;

        const subGoals = Array.from(todo.sub_goals);
        const [reorderedSubGoal] = subGoals.splice(result.source.index, 1);
        subGoals.splice(result.destination.index, 0, reorderedSubGoal);

        // Optimistic local update
        setTodos(prev => prev.map(t =>
            t.id === todoId ? { ...t, sub_goals: subGoals } : t
        ));

        const { error } = await reorderSubGoals(todoId, subGoals.map(sg => sg.id));
        if (error) {
            showToast.error('Failed to save sub-goal order.');
            loadTodos(); // revert on failure
        }
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

    const saveEditTodo = async (todoId: string) => {
        if (!editText.trim()) return;
        const { error } = await editTodoText(todoId, editText.trim());
        if (error) {
            showToast.error('Failed to update todo');
        } else {
            setEditingTodo(null);
            setEditText('');
            loadTodos();
            showToast.success('Updated!');
        }
    };

    const saveEditSubGoal = async (todoId: string, subGoalId: string) => {
        if (!editText.trim()) return;
        const { error } = await editSubGoalText(todoId, subGoalId, editText.trim());
        if (error) {
            showToast.error('Failed to update sub-goal');
        } else {
            setEditingSubGoal(null);
            setEditText('');
            loadTodos();
            showToast.success('Updated!');
        }
    };

    const deleteSubGoal = async (todoId: string, subGoalId: string) => {
        if (!confirm('Delete this sub-goal?')) return;
        const { error } = await deleteSubGoalFromTodo(todoId, subGoalId);
        if (error) {
            showToast.error('Failed to delete sub-goal');
        } else {
            loadTodos();
            showToast.success('Deleted!');
        }
    };

    const getSubGoalLabel = (priority: number, subIndex: number) => {
        return `${priority}${String.fromCharCode(97 + subIndex)}`;
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen pt-navbar flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: t.marginColor, borderTopColor: 'transparent' }}></div>
                        <p className="text-lg" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                            Loading your pad...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // All visible todos rendered together — completed items stay in place
    const visibleTodos = todos.filter(todo => !todo.hidden);
    const hiddenTodos = todos.filter(todo => todo.hidden);

    // Group by goal for grouped view
    const goalGroups = (() => {
        if (!groupByGoal) return [];
        const groups = new Map<string, TodoItem[]>();
        const UNGROUPED = '✏️ Quick Tasks';
        for (const todo of visibleTodos) {
            const key = todo.goal_title || UNGROUPED;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(todo);
        }
        // Sort: named goals first (alphabetical), ungrouped last
        const entries = Array.from(groups.entries());
        entries.sort((a, b) => {
            if (a[0] === UNGROUPED) return 1;
            if (b[0] === UNGROUPED) return -1;
            return a[0].localeCompare(b[0]);
        });
        return entries;
    })();

    return (
        <>
            <AuthNavbar />
            {/* FULL PAGE PAD */}
            <div
                className="min-h-screen pt-navbar relative"
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
                                Ongoing To-Do List
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
                                onClick={() => window.open('/lifeframe/print', '_blank')}
                                className={`px-4 py-3 border-2 rounded-lg font-bold shadow-md transition-all ${t.accentBg} ${t.accentText}`}
                                style={{ fontFamily: 'Courier New, monospace' }}
                                title="Export / Print as PDF"
                            >
                                Export PDF
                            </button>

                            {todos.filter(t => t.completed).length > 0 && (
                                <button
                                    onClick={clearCompleted}
                                    className="px-4 py-3 border-2 border-red-300 rounded-lg font-bold shadow-md transition-all bg-red-100 hover:bg-red-200 text-red-700"
                                    style={{ fontFamily: 'Courier New, monospace' }}
                                >
                                    🗑 Clear Done
                                </button>
                            )}

                            <button
                                onClick={toggleGroupByGoal}
                                className={`px-4 py-3 border-2 rounded-lg font-bold shadow-md transition-all ${
                                    groupByGoal
                                        ? 'bg-indigo-200 hover:bg-indigo-300 border-indigo-400 text-indigo-800'
                                        : `${t.accentBg} ${t.accentText}`
                                }`}
                                style={{ fontFamily: 'Courier New, monospace' }}
                                title={groupByGoal ? 'Switch to flat list' : 'Group tasks by goal'}
                            >
                                {groupByGoal ? '📂 Grouped' : '📂 Group'}
                            </button>

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
                    ) : groupByGoal ? (
                        /* ── GROUPED VIEW ──────────────────────────────── */
                        <div>
                            {goalGroups.map(([goalName, groupTodos]) => {
                                const isQuickTasks = goalName.startsWith('✏️');
                                return (
                                    <div key={goalName} className="mb-6">
                                        {/* Goal Section Header */}
                                        <div
                                            className="flex items-center gap-3 mb-1"
                                            style={{
                                                minHeight: '32px',
                                                lineHeight: '32px',
                                            }}
                                        >
                                            <div
                                                className="w-1.5 h-6 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: isQuickTasks
                                                        ? '#94a3b8'
                                                        : t.marginColor,
                                                }}
                                            />
                                            <span
                                                className="text-lg font-bold"
                                                style={{
                                                    fontFamily: 'Courier New, monospace',
                                                    color: t.text,
                                                }}
                                            >
                                                {goalName}
                                            </span>
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: t.marginColor + '18',
                                                    color: t.marginColor,
                                                    fontFamily: 'Courier New, monospace',
                                                }}
                                            >
                                                {groupTodos.filter(gt => !gt.completed).length}/{groupTodos.length}
                                            </span>
                                            <div
                                                className="flex-1 border-t border-dashed"
                                                style={{ borderColor: t.lineColor }}
                                            />
                                        </div>

                                        {/* Tasks in this group */}
                                        {groupTodos.map((todo, index) => (
                                            <div key={todo.id}>
                                                {/* Main Todo */}
                                                <div
                                                    className="flex items-center gap-4 group"
                                                    style={{
                                                        minHeight: '32px',
                                                        lineHeight: '32px',
                                                    }}
                                                >
                                                    {/* Spacer where drag handle would be */}
                                                    <div className="w-4" />

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
                                                            onBlur={() => saveEditTodo(todo.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveEditTodo(todo.id);
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
                                                            {todo.taskType === 'daily' && (
                                                                <span className="text-xs opacity-50 mr-1" title="Behavior change — resets daily">🔁</span>
                                                            )}
                                                            {todo.text}
                                                        </span>
                                                    )}

                                                    {/* Hide Button */}
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

                                                {/* Sub-Goals */}
                                                {todo.sub_goals && todo.sub_goals.length > 0 && (
                                                    <div className="ml-20">
                                                        {todo.sub_goals.map((subGoal, subIndex) => (
                                                            <div
                                                                key={subGoal.id}
                                                                className="flex items-center gap-4 group/sub"
                                                                style={{
                                                                    minHeight: '32px',
                                                                    lineHeight: '32px',
                                                                }}
                                                            >
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
                                                                        onBlur={() => saveEditSubGoal(todo.id, subGoal.id)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') saveEditSubGoal(todo.id, subGoal.id);
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
                                                                    onClick={() => deleteSubGoal(todo.id, subGoal.id)}
                                                                    className="opacity-0 group-hover/sub:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="todos">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {visibleTodos.map((todo, index) => (
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
                                                                    onBlur={() => saveEditTodo(todo.id)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') saveEditTodo(todo.id);
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
                                                                    {todo.taskType === 'daily' && (
                                                                        <span className="text-xs opacity-50 mr-1" title="Behavior change — resets daily">🔁</span>
                                                                    )}
                                                                    {todo.text}
                                                                    {todo.goal_title && (
                                                                        <span
                                                                            className="text-sm font-medium ml-2"
                                                                            style={{ color: todo.source === 'roadmap' ? '#1d4ed8' : '#15803d', opacity: 0.75 }}
                                                                        >
                                                                            → {todo.goal_title}
                                                                        </span>
                                                                    )}
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
                                                                                                    onBlur={() => saveEditSubGoal(todo.id, subGoal.id)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === 'Enter') saveEditSubGoal(todo.id, subGoal.id);
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
                                                                                                onClick={() => deleteSubGoal(todo.id, subGoal.id)}
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

                            {/* Task Type Selector */}
                            <div className="mt-4">
                                <label className="text-xs font-bold mb-2 block" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                                    TYPE
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewTodoType('one-time')}
                                        className={`flex-1 px-4 py-2.5 border-2 rounded-xl font-bold text-sm transition-all ${
                                            newTodoType === 'one-time'
                                                ? 'border-indigo-500 bg-indigo-100 text-indigo-800'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        style={{ fontFamily: 'Courier New, monospace', color: newTodoType !== 'one-time' ? t.text : undefined }}
                                    >
                                        📌 One-Time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTodoType('daily')}
                                        className={`flex-1 px-4 py-2.5 border-2 rounded-xl font-bold text-sm transition-all ${
                                            newTodoType === 'daily'
                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        style={{ fontFamily: 'Courier New, monospace', color: newTodoType !== 'daily' ? t.text : undefined }}
                                    >
                                        🔁 Behavior Change
                                    </button>
                                </div>
                                <p className="text-xs mt-1.5 opacity-60" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                                    {newTodoType === 'daily'
                                        ? 'Resets daily — comes back each morning'
                                        : 'Done once — stays completed'}
                                </p>
                            </div>

                            {/* Due Date (one-time only) */}
                            {newTodoType === 'one-time' && (
                                <div className="mt-4">
                                    <label className="text-xs font-bold mb-2 block" style={{ fontFamily: 'Courier New, monospace', color: t.text }}>
                                        DUE DATE (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={newTodoDueDate}
                                        onChange={(e) => setNewTodoDueDate(e.target.value)}
                                        className={`w-full px-4 py-2.5 border-2 rounded-xl ${t.inputBorder}`}
                                        style={{ fontFamily: 'Courier New, monospace', backgroundColor: theme === 'dark' ? '#1e293b' : 'white', color: t.text }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setNewTodoType('one-time'); setNewTodoDueDate(''); }}
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