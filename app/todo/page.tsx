'use client';

import { useState, useEffect } from 'react';
import { getAllTodos, toggleTodoCompletion, toggleSubGoalCompletion, addManualTodo, addSubGoal, deleteManualTodo, updateTodoOrder, TodoItem } from '@/lib/todos';
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

    // Editing states
    const [editingTodo, setEditingTodo] = useState<string | null>(null);
    const [editingSubGoal, setEditingSubGoal] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

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

        const items = Array.from(todos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            priority: index + 1
        }));

        setTodos(updatedItems);
        updateTodoOrder(updatedItems);
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
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fef9c3' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg" style={{ fontFamily: 'Courier New, monospace' }}>
                        Loading yellow pad...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* FULL PAGE YELLOW PAD */}
            <div
                className="min-h-screen relative"
                style={{
                    backgroundColor: '#fef9c3',
                    color: '#111827',
                    backgroundImage: `
                        repeating-linear-gradient(
                            transparent,
                            transparent 31px,
                            #94a3b8 31px,
                            #94a3b8 32px
                        ),
                        linear-gradient(90deg, transparent 0px, transparent 80px, #dc2626 80px, #dc2626 82px, transparent 82px)
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
                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 font-bold text-sm mb-2 transition-colors"
                                style={{ fontFamily: 'Courier New, monospace' }}
                            >
                                ← DASHBOARD
                            </Link>
                            <h1
                                className="text-5xl font-bold text-gray-900 mb-1"
                                style={{ fontFamily: 'Courier New, monospace', lineHeight: '1.2' }}
                            >
                                {userName}'s Yellow Pad
                            </h1>
                            <p className="text-gray-700 font-semibold mb-1" style={{ fontFamily: 'Courier New, monospace' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-gray-600" style={{ fontFamily: 'Courier New, monospace' }}>
                                <span className="text-blue-600 font-bold">Blue</span> = Roadmap •
                                <span className="text-green-600 font-bold ml-2">Green</span> = Manual
                            </p>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-yellow-300 hover:bg-yellow-400 border-2 border-yellow-500 text-gray-900 rounded-lg font-bold shadow-md transition-all"
                            style={{ fontFamily: 'Courier New, monospace' }}
                        >
                            ✏️ ADD TODO
                        </button>
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
                                        {todos.map((todo, index) => (
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
                                                                    backgroundColor: (todo.priority || index + 1) <= 3 ? '#ef4444' : (todo.priority || index + 1) <= 6 ? '#f97316' : '#6b7280'
                                                                }}
                                                            >
                                                                {todo.priority && todo.priority < 9999 ? todo.priority : index + 1}
                                                            </div>

                                                            {/* Checkbox */}
                                                            <button
                                                                onClick={() => handleToggle(todo)}
                                                                className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 hover:border-gray-800 transition-colors"
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
                                                                    className={`text-lg flex-1 cursor-pointer hover:bg-yellow-200/50 px-1 rounded ${todo.completed ? 'line-through' : ''}`}
                                                                    style={{
                                                                        fontFamily: 'Courier New, monospace',
                                                                        color: todo.source === 'roadmap' ? '#2563eb' : '#15803d'
                                                                    }}
                                                                >
                                                                    {todo.text}
                                                                </span>
                                                            )}

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
                                                                                                {getSubGoalLabel(todo.priority || index + 1, subIndex)}
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
                </div>

                {/* Paper Shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-400/20 to-transparent pointer-events-none" />
            </div>

            {/* Add Todo Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-yellow-50 rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 border-yellow-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Courier New, monospace' }}>
                            Add New Todo
                        </h2>
                        <form onSubmit={handleAddTodo}>
                            <input
                                type="text"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                placeholder="What do you need to do?"
                                className="w-full px-4 py-3 border-2 border-yellow-400 rounded-xl bg-white text-gray-900"
                                style={{ fontFamily: 'Courier New, monospace' }}
                                autoFocus
                                required
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-400 bg-white rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                                    style={{ fontFamily: 'Courier New, monospace' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-yellow-300 border-2 border-yellow-500 text-gray-900 rounded-xl font-bold hover:bg-yellow-400"
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
                    <div className="bg-yellow-50 rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 border-yellow-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Courier New, monospace' }}>
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
                                className="w-full px-4 py-3 border-2 border-yellow-400 rounded-xl bg-white text-gray-900"
                                style={{ fontFamily: 'Courier New, monospace' }}
                                autoFocus
                                required
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSubGoalModal(null)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-400 bg-white rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                                    style={{ fontFamily: 'Courier New, monospace' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-yellow-300 border-2 border-yellow-500 text-gray-900 rounded-xl font-bold hover:bg-yellow-400"
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