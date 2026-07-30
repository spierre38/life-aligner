import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { RoadmapData, Activity } from '@/lib/roadmap-types';

/**
 * GET /api/todos/daily-reset
 *
 * Called by Vercel Cron at midnight UTC daily.
 * Resets all 'daily' (behavior change) tasks to incomplete
 * so they reappear fresh on the user's To-Do list each morning.
 * Secured by CRON_SECRET env var.
 */

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

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    try {
        // Fetch all roadmap entries
        const { data: rows, error: fetchError } = await supabase
            .from('workbook_entries')
            .select('user_id, content')
            .eq('category', 'roadmap');

        if (fetchError) {
            console.error('[daily-reset] fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'No roadmap entries found', reset: 0 });
        }

        let totalReset = 0;
        let usersUpdated = 0;

        for (const row of rows) {
            const content = row.content as unknown as RoadmapData;
            if (!content || content.schema_version !== 3) continue;

            let changed = false;

            // Reset daily activities that are completed
            const updatedActivities = content.activities.map((activity: Activity & { taskType?: string }) => {
                if (activity.taskType === 'daily' && activity.completed) {
                    changed = true;
                    totalReset++;
                    return {
                        ...activity,
                        completed: false,
                        completedAt: undefined,
                        updatedAt: now,
                    };
                }
                return activity;
            });

            if (!changed) continue;

            // Save updated roadmap
            const { error: updateError } = await supabase
                .from('workbook_entries')
                .update({
                    content: {
                        ...content,
                        activities: updatedActivities,
                        updated_at: now,
                    },
                })
                .eq('user_id', row.user_id)
                .eq('category', 'roadmap');

            if (updateError) {
                console.error(`[daily-reset] update error for user ${row.user_id}:`, updateError);
            } else {
                usersUpdated++;
            }
        }

        console.log(`[daily-reset] Reset ${totalReset} daily tasks for ${usersUpdated} users`);

        return NextResponse.json({
            message: 'Daily reset complete',
            totalReset,
            usersUpdated,
            timestamp: now,
        });
    } catch (err) {
        console.error('[daily-reset] unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
