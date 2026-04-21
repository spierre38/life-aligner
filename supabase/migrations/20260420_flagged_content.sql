-- ============================================================
-- flagged_content table
-- Stores both user-reported posts and auto-flagged content
-- ============================================================

CREATE TABLE IF NOT EXISTS flagged_content (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         uuid REFERENCES social_posts(id) ON DELETE SET NULL,
    user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,       -- author of flagged content
    reported_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,       -- user who reported (null = auto)
    reported_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    content         text NOT NULL,
    reason          text NOT NULL,
    status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('user_reported', 'auto_flagged', 'reviewed_ok', 'removed')),
    context         text NOT NULL DEFAULT 'post'
                    CHECK (context IN ('post', 'comment')),
    reviewed_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Only admins can read; inserts come from service role or authenticated users (for self-reports)
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all" ON flagged_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "users_insert_reports" ON flagged_content
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_flagged_content_status ON flagged_content(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged_content_post ON flagged_content(post_id);
