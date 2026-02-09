// lib/todoHelpers.ts
// Helper functions for Roadmap → To-Do List integration

import { supabase } from '@/lib/supabase';

export type RoadmapContext = {
    life_category: string;
    goal: string;
    activity: string;
};

/**
 * Add a Roadmap activity to user's To-Do list
 */
export async function addRoadmapActivityToTodo(
    userId: string,
    activity: string,
    context: RoadmapContext
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if this activity is already in the to-do list
        const { data: existing, error: checkError } = await supabase
            .from('todo_items')
            .select('id')
            .eq('user_id', userId)
            .eq('text', activity)
            .eq('completed', false)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        // If already exists, don't add again
        if (existing) {
            return {
                success: false,
                error: 'This activity is already in your To-Do list!'
            };
        }

        // Add to to-do list
        const { error: insertError } = await supabase
            .from('todo_items')
            .insert({
                user_id: userId,
                text: activity,
                completed: false,
                from_roadmap: true,
                roadmap_context: context
            });

        if (insertError) throw insertError;

        return { success: true };
    } catch (error) {
        console.error('Error adding to To-Do list:', error);
        return {
            success: false,
            error: 'Failed to add to To-Do list. Please try again.'
        };
    }
}

/**
 * Check if a specific activity is already in user's To-Do list
 */
export async function isActivityInTodoList(
    userId: string,
    activity: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('todo_items')
            .select('id')
            .eq('user_id', userId)
            .eq('text', activity)
            .eq('completed', false)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking To-Do list:', error);
        return false;
    }
}

/**
 * Get count of incomplete to-do items for dashboard widget
 */
export async function getIncompleteTodoCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('todo_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting todo count:', error);
        return 0;
    }
}

/**
 * Get count of completed to-do items today
 */
export async function getCompletedTodayCount(userId: string): Promise<number> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('todo_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .gte('completed_at', today.toISOString());

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting completed today count:', error);
        return 0;
    }
}

/**
 * Clear all completed to-do items
 */
export async function clearCompletedTodos(userId: string): Promise<{ success: boolean; count: number }> {
    try {
        const { data, error } = await supabase
            .from('todo_items')
            .delete()
            .eq('user_id', userId)
            .eq('completed', true)
            .select();

        if (error) throw error;

        return {
            success: true,
            count: data?.length || 0
        };
    } catch (error) {
        console.error('Error clearing completed todos:', error);
        return { success: false, count: 0 };
    }
}
