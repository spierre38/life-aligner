/**
 * DIAGNOSTIC ROUTE — TEMPORARY
 * Returns the raw workbook_entries content + evaluateLifeFrameCompletion
 * result for the current user so we can see exactly why completion is failing.
 *
 * DELETE this file once the issue is identified.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { evaluateLifeFrameCompletion } from '@/lib/lifeframe-completion';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: worksheets, error } = await supabase
        .from('workbook_entries')
        .select('category, content')
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const completion = evaluateLifeFrameCompletion(worksheets ?? []);

    return NextResponse.json({
        userId: user.id,
        rowsFound: worksheets?.length ?? 0,
        categories: worksheets?.map(w => w.category),
        completion,
        // Raw content so we can see exact shape of each section
        rawValues: worksheets?.find(w => w.category === 'values')?.content ?? null,
        rawInterests: worksheets?.find(w => w.category === 'interests')?.content ?? null,
        rawLifeCategories: worksheets?.find(w => w.category === 'life_categories')?.content ?? null,
    });
}
