import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/notifications/subscribe
 * Body: { subscription: PushSubscription, notifyHour: number, notifyMinute: number, timezone: string }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { subscription, notifyHour = 8, notifyMinute = 0, timezone = 'America/New_York' } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id:       user.id,
            endpoint:      subscription.endpoint,
            p256dh:        subscription.keys.p256dh,
            auth:          subscription.keys.auth,
            notify_hour:   notifyHour,
            notify_minute: notifyMinute,
            timezone,
            enabled:       true,
        }, { onConflict: 'user_id,endpoint' });

    if (error) {
        console.error('[subscribe] DB error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/notifications/subscribe
 * Removes the subscription for the current user.
 */
export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    if (endpoint) query = query.eq('endpoint', endpoint) as typeof query;

    const { error } = await query;
    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
    return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/notifications/subscribe
 * Update notification time preference.
 */
export async function PATCH(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notifyHour, notifyMinute, timezone, enabled } = await req.json();
    const update: Record<string, unknown> = {};
    if (notifyHour   !== undefined) update.notify_hour   = notifyHour;
    if (notifyMinute !== undefined) update.notify_minute = notifyMinute;
    if (timezone     !== undefined) update.timezone      = timezone;
    if (enabled      !== undefined) update.enabled       = enabled;

    const { error } = await supabase
        .from('push_subscriptions')
        .update(update)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
    return NextResponse.json({ ok: true });
}
