// lib/accountability.ts
// Helper functions for accountability buddy features

import { supabase } from './supabase';

// ===================================
// USER SEARCH & DISCOVERY
// ===================================

/**
 * Search for users by name or email
 */
export async function searchUsers(query: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at')
        .or(`full_name.ilike.%${query}%`)
        .limit(10);

    return { data, error };
}

/**
 * Get user by ID (for viewing partner profile)
 */
export async function getUserById(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at')
        .eq('id', userId)
        .single();

    return { data, error };
}


// ===================================
// SHARED PROGRESS VIEW
// ===================================

/**
 * Get partner's roadmap (requires active partnership)
 */
export async function getPartnerRoadmap(partnerId: string) {
    const { data, error } = await supabase
        .from('workbook_entries')
        .select('*')
        .eq('user_id', partnerId)
        .eq('category', 'roadmap')
        .single();

    return { data, error };
}

/**
 * Get partner's values
 */
export async function getPartnerValues(partnerId: string) {
    const { data, error } = await supabase
        .from('workbook_entries')
        .select('*')
        .eq('user_id', partnerId)
        .eq('category', 'values')
        .single();

    return { data, error };
}

/**
 * Get partner's recent activity
 */
export async function getPartnerActivity(partnerId: string, limit = 10) {
    const { data, error } = await supabase
        .from('partner_activity')
        .select('*')
        .eq('user_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return { data, error };
}


// ===================================
// NOTIFICATIONS
// ===================================

/**
 * Get user's partner notifications
 */
export async function getPartnerNotifications(unreadOnly = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    let query = supabase
        .from('partner_notifications')
        .select(`
      *,
      partnership:partnerships(
        id,
        user1:profiles!partnerships_user1_id_fkey(id, full_name, avatar_url),
        user2:profiles!partnerships_user2_id_fkey(id, full_name, avatar_url)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (unreadOnly) {
        query = query.eq('read', false);
    }

    const { data, error } = await query.limit(50);

    return { data, error };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
    const { error } = await supabase
        .from('partner_notifications')
        .update({ read: true })
        .eq('id', notificationId);

    return { error };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { error } = await supabase
        .from('partner_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    return { error };
}


// ===================================
// CHECK-INS
// ===================================

/**
 * Send check-in to partner
 */
export async function sendCheckIn(partnershipId: string, partnerId: string, message: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
        .from('partner_checkins')
        .insert({
            partnership_id: partnershipId,
            from_user_id: user.id,
            to_user_id: partnerId,
            message
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get check-ins for a partnership
 */
export async function getCheckIns(partnershipId: string) {
    const { data, error } = await supabase
        .from('partner_checkins')
        .select(`
      *,
      from_user:profiles!partner_checkins_from_user_id_fkey(id, full_name, avatar_url),
      to_user:profiles!partner_checkins_to_user_id_fkey(id, full_name, avatar_url)
    `)
        .eq('partnership_id', partnershipId)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Get pending check-ins (sent to me, not responded)
 */
export async function getPendingCheckIns() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
        .from('partner_checkins')
        .select(`
      *,
      from_user:profiles!partner_checkins_from_user_id_fkey(id, full_name, avatar_url),
      partnership:partnerships(id)
    `)
        .eq('to_user_id', user.id)
        .is('responded_at', null)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Respond to check-in
 */
export async function respondToCheckIn(checkInId: string, response: string) {
    const { error } = await supabase
        .from('partner_checkins')
        .update({
            response,
            responded_at: new Date().toISOString()
        })
        .eq('id', checkInId);

    return { error };
}


// ===================================
// ACTIVITY LOGGING
// ===================================

/**
 * Log activity (goal completed, milestone posted, etc.)
 * This automatically notifies partners
 */
export async function logActivity(
    activityType: 'goal_completed' | 'milestone_posted' | 'roadmap_updated' | 'value_changed',
    activityData: any
) {
    const { data, error } = await supabase.rpc('log_partner_activity', {
        p_activity_type: activityType,
        p_activity_data: activityData
    });

    return { data, error };
}


// ===================================
// PARTNER FEED (posts visible only to partners)
// ===================================

/**
 * Get partner-only posts
 */
export async function getPartnerFeed() {
    const { data, error } = await supabase
        .from('social_posts')
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .eq('visibility', 'partners')
        .order('created_at', { ascending: false })
        .limit(20);

    return { data, error };
}
