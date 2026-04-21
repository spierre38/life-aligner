import { NextRequest, NextResponse } from 'next/server';
import { checkContent } from '@/lib/moderation';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    // Instantiate inside handler so env vars are only needed at runtime, not build time
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const { content, userId, postId, context } = await req.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }

        const result = checkContent(content);

        // Hard block — do not allow the post
        if (!result.allowed) {
            return NextResponse.json({
                allowed: false,
                tier: 'hard',
                message: "Your post contains language that isn't allowed in this community.",
            });
        }

        // Soft flag — allow but log to admin review queue
        if (result.flagged && result.tier === 'soft' && userId) {
            await supabaseAdmin.from('flagged_content').insert({
                post_id: postId || null,
                user_id: userId,
                content,
                reason: `Auto-flagged: soft profanity (${result.matches.join(', ')})`,
                status: 'auto_flagged',
                context: context || 'post',
            });
        }

        return NextResponse.json({ allowed: true, flagged: result.flagged });
    } catch (err) {
        console.error('Moderation API error:', err);
        // Fail open — don't block posts if moderation service is down
        return NextResponse.json({ allowed: true, flagged: false });
    }
}
