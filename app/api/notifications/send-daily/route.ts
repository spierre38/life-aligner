import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

/**
 * GET /api/notifications/send-daily
 *
 * Called by Vercel Cron once daily at 8am UTC (Hobby plan).
 * Sends a personalized Life Inbox digest to all enabled subscribers.
 * Secured by CRON_SECRET env var.
 */

// Service-role Supabase client (bypasses RLS to read all subscriptions)
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Guard: env vars must exist at runtime
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    // Set VAPID details here (runtime only — not at module load time)
    webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL ?? 'hello@example.com'),
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
    );

    const supabase = getServiceClient();
    const nowUTC = new Date();
    const currentHourUTC = nowUTC.getUTCHours();

    // Fetch all enabled subscriptions, then filter by timezone-aware hour match.
    // A user's notify_hour is in THEIR timezone. We check if the current UTC hour
    // matches what that local hour would be in UTC.
    const { data: allSubs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('enabled', true);

    if (error) {
        console.error('[send-daily] fetch error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Filter: does the user's preferred local hour == current UTC hour?
    const subscriptions = (allSubs ?? []).filter(sub => {
        try {
            // Get the current hour in the user's timezone
            const userLocalHour = parseInt(
                new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    hour12: false,
                    timeZone: sub.timezone || 'America/New_York',
                }).format(nowUTC),
                10
            );
            return userLocalHour === (sub.notify_hour ?? 8);
        } catch {
            // Fallback: compare directly against UTC
            return (sub.notify_hour ?? 8) === currentHourUTC;
        }
    });

    if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ sent: 0, message: 'No subscriptions for this hour' });
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
        // Count pending tasks for this user using the workbook
        const { data: taskData } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', sub.user_id)
            .eq('category', 'todos')
            .maybeSingle();

        const manualTodos: any[] = (taskData?.content as any)?.manual_todos ?? [];
        const pendingCount = manualTodos.filter((t: any) => !t.completed).length;
        const overdueCount = manualTodos.filter((t: any) => {
            if (t.completed || !t.due_date) return false;
            return new Date(t.due_date) < new Date();
        }).length;

        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        const title = overdueCount > 0
            ? `⚠️ ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`
            : pendingCount > 0
                ? `📋 ${pendingCount} task${pendingCount > 1 ? 's' : ''} in your Life Inbox`
                : '✅ Life Inbox clear — great job!';

        const body = overdueCount > 0
            ? `You also have ${pendingCount} tasks pending today.`
            : pendingCount > 0
                ? 'Tap to open your Life Inbox and get started.'
                : 'All caught up. Keep the momentum going.';

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'daily-digest',
            renotify: true,
            data: { url: '/todo' },
        });

        try {
            await webpush.sendNotification(pushSubscription, payload);
            sent++;
        } catch (err: any) {
            console.error('[send-daily] push failed for', sub.user_id, err.statusCode);
            // 410 Gone = subscription expired; remove it
            if (err.statusCode === 410) {
                await supabase.from('push_subscriptions').delete()
                    .eq('user_id', sub.user_id).eq('endpoint', sub.endpoint);
            }
            failed++;
        }
    }

    return NextResponse.json({ sent, failed, hour: currentHourUTC });
}
