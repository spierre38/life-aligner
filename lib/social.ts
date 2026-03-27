// lib/social.ts
// Social features helper functions with proper UUID sorting and security

import { supabase } from './supabase';
import { nanoid } from 'nanoid';

// ===================================
// PARTNERSHIPS
// ===================================

/**
 * Create partnership request (handles UUID sorting automatically)
 */
export async function createPartnership(partnerId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    // CRITICAL: Sort UUIDs to satisfy CHECK (user1_id < user2_id) constraint
    const [user1_id, user2_id] = [user.id, partnerId].sort();

    const { data, error } = await supabase
        .from('partnerships')
        .insert({
            user1_id,
            user2_id,
            status: 'pending',
            requested_by: user.id  // Track who sent the invite
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get user's partnerships (handles bidirectional lookup)
 */
export async function getUserPartnerships(status: 'pending' | 'active' | 'ended' = 'active') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
        .from('partnerships')
        .select(`
      *,
      user1:profiles!partnerships_user1_id_fkey(id, full_name, avatar_url),
      user2:profiles!partnerships_user2_id_fkey(id, full_name, avatar_url)
    `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', status);

    // Transform to always show partner (not self)
    let formatted = data?.map(p => ({
        ...p,
        partner: p.user1_id === user.id ? p.user2 : p.user1
    }));

    // For pending: only show invites where current user is the RECIPIENT (not the sender)
    if (status === 'pending' && formatted) {
        formatted = formatted.filter(p => p.requested_by !== user.id);
    }

    return { data: formatted, error };
}

/**
 * Accept partnership request (only the RECIPIENT can accept, not the sender)
 */
export async function acceptPartnership(partnershipId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    // First fetch the partnership to check who requested it
    const { data: partnership, error: fetchError } = await supabase
        .from('partnerships')
        .select('*')
        .eq('id', partnershipId)
        .single();

    if (fetchError || !partnership) {
        return { data: null, error: fetchError || { message: 'Partnership not found' } };
    }

    // Block the sender from accepting their own invite
    if (partnership.requested_by === user.id) {
        return { data: null, error: { message: 'You cannot accept your own invite' } };
    }

    const { data, error } = await supabase
        .from('partnerships')
        .update({ status: 'active' })
        .eq('id', partnershipId)
        .select()
        .single();

    return { data, error };
}

/**
 * End partnership
 */
export async function endPartnership(partnershipId: string) {
    const { data, error } = await supabase
        .from('partnerships')
        .update({ status: 'ended' })
        .eq('id', partnershipId)
        .select()
        .single();

    return { data, error };
}


// ===================================
// POSTS
// ===================================

/**
 * Create a new post
 */
export async function createPost(
    content: string,
    postType: 'milestone' | 'goal' | 'update' | 'win',
    visibility: 'public' | 'private' | 'partners' = 'public'
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
        .from('social_posts')
        .insert({
            user_id: user.id,
            content,
            post_type: postType,
            visibility
        })
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .single();

    return { data, error };
}

/**
 * Get community feed (public posts + partner posts)
 */
export async function getCommunityFeed(limit = 20, offset = 0) {
    const { data, error } = await supabase
        .from('social_posts')
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    return { data, error };
}

/**
 * Get user's own posts
 */
export async function getUserPosts(userId?: string, limit = 20) {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) return { data: null, error: { message: 'No user ID' } };

    const { data, error } = await supabase
        .from('social_posts')
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return { data, error };
}

/**
 * Update a post
 */
export async function updatePost(postId: string, content: string) {
    const { data, error } = await supabase
        .from('social_posts')
        .update({ content })
        .eq('id', postId)
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .single();

    return { data, error };
}

/**
 * Delete a post
 */
export async function deletePost(postId: string) {
    const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);

    return { error };
}


// ===================================
// LIKES (uses SECURITY DEFINER function)
// ===================================

/**
 * Like a post (atomic with counter increment)
 */
export async function likePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { error } = await supabase.rpc('like_post', {
        p_post_id: postId,
        p_user_id: user.id
    });

    return { error };
}

/**
 * Unlike a post (atomic with counter decrement)
 */
export async function unlikePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { error } = await supabase.rpc('unlike_post', {
        p_post_id: postId,
        p_user_id: user.id
    });

    return { error };
}

/**
 * Check if user has liked a post
 */
export async function hasLikedPost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

    return { data: !!data, error };
}

/**
 * Batch check liked posts (for feed optimization)
 */
export async function getBatchLikedPosts(postIds: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || postIds.length === 0) return { data: new Set<string>(), error: null };

    const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

    const likedIds = new Set(data?.map(l => l.post_id) || []);
    return { data: likedIds, error };
}


// ===================================
// COMMENTS (uses SECURITY DEFINER function)
// ===================================

/**
 * Add comment to post (atomic with counter increment)
 */
export async function addComment(postId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase.rpc('add_comment', {
        p_post_id: postId,
        p_user_id: user.id,
        p_content: content
    });

    return { data, error };
}

/**
 * Delete comment (atomic with counter decrement, ownership checked in function)
 */
export async function deleteComment(commentId: string) {
    const { error } = await supabase.rpc('delete_comment', {
        p_comment_id: commentId
    });

    return { error };
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string) {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    return { data, error };
}


// ===================================
// SHARING
// ===================================

/**
 * Generate URL-safe share token
 */
export function generateShareToken(): string {
    return nanoid(12);
}

/**
 * Create shareable roadmap link
 */
export async function createShareLink() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const token = generateShareToken();

    const { data, error } = await supabase
        .from('shared_roadmaps')
        .insert({
            user_id: user.id,
            share_token: token
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get shared roadmap by token (uses SECURITY DEFINER function for public access)
 */
export async function getSharedRoadmap(token: string) {
    const { data, error } = await supabase.rpc('get_shared_roadmap', {
        p_token: token
    });

    return { data: data?.[0] || null, error };
}

/**
 * Get user's share links
 */
export async function getUserShareLinks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
        .from('shared_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Delete share link
 */
export async function deleteShareLink(linkId: string) {
    const { error } = await supabase
        .from('shared_roadmaps')
        .delete()
        .eq('id', linkId);

    return { error };
}
