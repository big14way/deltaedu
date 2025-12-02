-- Migration: User Activities Table
-- Description: Create table for tracking user activities
-- Date: 2025-12-02

-- ============================================
-- USER ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note_upload', 'quiz_completed', 'chat_session'
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON user_activities(user_id, created_at DESC);

-- RLS Policies for user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- To apply this migration:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
