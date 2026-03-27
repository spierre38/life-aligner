// lib/todos.ts
// Enhanced with sub-goals support

import { supabase } from './supabase';
import { nanoid } from 'nanoid';

export interface SubGoal {
    id: string;
    text: string;
    completed: boolean;
    completed_at?: string | null;
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    completed_at?: string | null;
    source: 'roadmap' | 'manual';
    goal_title?: string;
    category?: string;
    priority?: number;
    due_date?: string;
    notes?: string;
    sub_goals?: SubGoal[];
}

// ===================================
// GET ALL TODOS
// ===================================

export async function getAllTodos(): Promise<{ data: TodoItem[] | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { data: [], error: null };
        }

        const { data: roadmapEntry, error } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .maybeSingle();

        if (error) {
            console.error('Error fetching roadmap:', error);
            return { data: null, error };
        }

        if (!roadmapEntry?.content) {
            return { data: [], error: null };
        }

        const todos: TodoItem[] = [];
        const content = roadmapEntry.content;

        // Extract roadmap activities
        if (content.items && Array.isArray(content.items)) {
            content.items.forEach((item: any, itemIndex: number) => {
                const goalTitle = item.goal || item.behavior_change || 'Untitled';

                if (item.activities && Array.isArray(item.activities)) {
                    item.activities.forEach((activity: any, actIndex: number) => {
                        if (typeof activity === 'string') {
                            todos.push({
                                id: `roadmap_${itemIndex}_${actIndex}`,
                                text: activity,
                                completed: false,
                                source: 'roadmap',
                                goal_title: goalTitle,
                                category: item.category,
                                priority: itemIndex * 100 + actIndex + 1,
                                sub_goals: []
                            });
                        } else {
                            todos.push({
                                id: activity.id || `roadmap_${itemIndex}_${actIndex}`,
                                text: activity.text || activity,
                                completed: activity.completed || false,
                                completed_at: activity.completed_at || null,
                                source: 'roadmap',
                                goal_title: goalTitle,
                                category: item.category,
                                priority: activity.priority || (itemIndex * 100 + actIndex + 1),
                                due_date: activity.due_date,
                                notes: activity.notes,
                                sub_goals: activity.sub_goals || []
                            });
                        }
                    });
                }
            });
        }

        // Extract manual todos
        if (content.manual_todos && Array.isArray(content.manual_todos)) {
            content.manual_todos.forEach((todo: any) => {
                todos.push({
                    id: todo.id || `manual_${nanoid(8)}`,
                    text: todo.text,
                    completed: todo.completed || false,
                    completed_at: todo.completed_at || null,
                    source: 'manual',
                    category: todo.category,
                    priority: todo.priority || (todos.length + 1),
                    due_date: todo.due_date,
                    notes: todo.notes,
                    sub_goals: todo.sub_goals || []
                });
            });
        }

        // Sort by priority
        todos.sort((a, b) => (a.priority || 9999) - (b.priority || 9999));

        return { data: todos, error: null };

    } catch (err) {
        console.error('Error in getAllTodos:', err);
        return { data: null, error: err };
    }
}

// ===================================
// TOGGLE TODO COMPLETION
// ===================================

export async function toggleTodoCompletion(todoId: string, source: 'roadmap' | 'manual') {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (fetchError || !roadmapEntry) {
            return { error: fetchError || { message: 'No roadmap found' } };
        }

        const content = roadmapEntry.content;
        let updated = false;

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        const activityId = typeof activity === 'object' ? activity.id : null;

                        if (activityId === todoId) {
                            updated = true;
                            const newCompleted = typeof activity === 'object' ? !activity.completed : true;
                            return {
                                ...(typeof activity === 'string' ? { text: activity } : activity),
                                id: activityId || todoId,
                                completed: newCompleted,
                                completed_at: newCompleted ? new Date().toISOString() : null
                            };
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    updated = true;
                    const newCompleted = !todo.completed;
                    return {
                        ...todo,
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    };
                }
                return todo;
            });
        }

        if (!updated) {
            return { error: { message: 'Todo not found' } };
        }

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        return { error: updateError };

    } catch (err) {
        console.error('Error toggling todo:', err);
        return { error: err };
    }
}

// ===================================
// TOGGLE SUB-GOAL COMPLETION
// ===================================

export async function toggleSubGoalCompletion(todoId: string, subGoalId: string, source: 'roadmap' | 'manual') {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (fetchError || !roadmapEntry) {
            return { error: fetchError || { message: 'No roadmap found' } };
        }

        const content = roadmapEntry.content;
        let updated = false;

        const updateSubGoals = (todo: any) => {
            if (todo.sub_goals && Array.isArray(todo.sub_goals)) {
                todo.sub_goals = todo.sub_goals.map((sg: any) => {
                    if (sg.id === subGoalId) {
                        updated = true;
                        const newCompleted = !sg.completed;
                        return {
                            ...sg,
                            completed: newCompleted,
                            completed_at: newCompleted ? new Date().toISOString() : null
                        };
                    }
                    return sg;
                });
            }
            return todo;
        };

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return updateSubGoals(activity);
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return updateSubGoals(todo);
                }
                return todo;
            });
        }

        if (!updated) {
            return { error: { message: 'Sub-goal not found' } };
        }

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        return { error: updateError };

    } catch (err) {
        console.error('Error toggling sub-goal:', err);
        return { error: err };
    }
}

// ===================================
// ADD SUB-GOAL
// ===================================

export async function addSubGoal(todoId: string, subGoalText: string, source: 'roadmap' | 'manual') {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (fetchError || !roadmapEntry) {
            return { error: fetchError || { message: 'No roadmap found' } };
        }

        const content = roadmapEntry.content;
        const newSubGoal: SubGoal = {
            id: nanoid(12),
            text: subGoalText,
            completed: false,
            completed_at: null
        };

        let updated = false;

        const addToTodo = (todo: any) => {
            if (!todo.sub_goals) {
                todo.sub_goals = [];
            }
            todo.sub_goals.push(newSubGoal);
            updated = true;
            return todo;
        };

        if (source === 'roadmap' && content.items) {
            content.items = content.items.map((item: any) => {
                if (item.activities) {
                    item.activities = item.activities.map((activity: any) => {
                        if (typeof activity === 'object' && activity.id === todoId) {
                            return addToTodo(activity);
                        }
                        return activity;
                    });
                }
                return item;
            });
        } else if (source === 'manual' && content.manual_todos) {
            content.manual_todos = content.manual_todos.map((todo: any) => {
                if (todo.id === todoId) {
                    return addToTodo(todo);
                }
                return todo;
            });
        }

        if (!updated) {
            return { error: { message: 'Todo not found' } };
        }

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        return { data: newSubGoal, error: updateError };

    } catch (err) {
        console.error('Error adding sub-goal:', err);
        return { error: err };
    }
}

// ===================================
// ADD MANUAL TODO
// ===================================

export async function addManualTodo(text: string, options?: {
    priority?: number;
    due_date?: string;
    category?: string;
    notes?: string;
}) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .maybeSingle();

        if (fetchError) {
            return { error: fetchError };
        }

        const content = roadmapEntry?.content || { items: [] };

        if (!content.manual_todos) {
            content.manual_todos = [];
        }

        const newTodo = {
            id: `manual_${nanoid(12)}`,
            text,
            completed: false,
            completed_at: null,
            priority: options?.priority || (content.manual_todos.length + 1),
            due_date: options?.due_date || null,
            category: options?.category || null,
            notes: options?.notes || null,
            sub_goals: []
        };

        content.manual_todos.push(newTodo);

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .upsert({
                user_id: user.id,
                category: 'roadmap',
                content,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,category'
            });

        return { data: newTodo, error: updateError };

    } catch (err) {
        console.error('Error adding manual todo:', err);
        return { error: err };
    }
}

// ===================================
// DELETE MANUAL TODO
// ===================================

export async function deleteManualTodo(todoId: string) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (fetchError || !roadmapEntry) {
            return { error: fetchError || { message: 'No roadmap found' } };
        }

        const content = roadmapEntry.content;

        if (!content.manual_todos) {
            return { error: { message: 'No manual todos' } };
        }

        content.manual_todos = content.manual_todos.filter((todo: any) => todo.id !== todoId);

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        return { error: updateError };

    } catch (err) {
        console.error('Error deleting todo:', err);
        return { error: err };
    }
}

// ===================================
// UPDATE TODO ORDER
// ===================================

export async function updateTodoOrder(orderedTodos: TodoItem[]) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: roadmapEntry, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'roadmap')
            .single();

        if (fetchError || !roadmapEntry) {
            return { error: fetchError || { message: 'No roadmap found' } };
        }

        const content = roadmapEntry.content;

        orderedTodos.forEach((todo, index) => {
            if (todo.source === 'roadmap' && content.items) {
                content.items = content.items.map((item: any) => {
                    if (item.activities) {
                        item.activities = item.activities.map((activity: any) => {
                            if ((typeof activity === 'object' ? activity.id : null) === todo.id) {
                                return {
                                    ...(typeof activity === 'string' ? { text: activity } : activity),
                                    priority: index + 1
                                };
                            }
                            return activity;
                        });
                    }
                    return item;
                });
            } else if (todo.source === 'manual' && content.manual_todos) {
                content.manual_todos = content.manual_todos.map((t: any) => {
                    if (t.id === todo.id) {
                        return { ...t, priority: index + 1 };
                    }
                    return t;
                });
            }
        });

        const { error: updateError } = await supabase
            .from('workbook_entries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', 'roadmap');

        return { error: updateError };

    } catch (err) {
        console.error('Error updating order:', err);
        return { error: err };
    }
}
