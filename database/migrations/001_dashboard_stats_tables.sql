-- Migration: Dashboard Statistics Tables
-- Description: Create tables needed for dashboard statistics tracking
-- Date: 2025-12-02

-- ============================================
-- QUIZ RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON quiz_results(user_id, score);

-- RLS Policies for quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STUDY SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL, -- 'notes', 'tutor', 'quiz'
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL, -- in seconds
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_duration ON study_sessions(user_id, duration);

-- RLS Policies for study_sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- To apply this migration:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
