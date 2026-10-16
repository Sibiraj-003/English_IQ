-- ==============================================================================
-- NOVA AI LEARNING COMPANION — SUPABASE MIGRATION
-- Supports:
-- 1. Study Sessions & Time Tracking (Reading, Practice, AI Interaction, Teach-Back)
-- 2. Multi-Dimensional Concept Mastery (Recall vs Conceptual Understanding)
-- 3. "Explain it to NOVA" (Teach-Back Engine & Misconception Detection)
-- 4. Evidence-based AI Learning Badges
-- 5. Persistent NOVA Multi-Turn Session State
-- 6. Privacy-preserving Test Integrity Events (Signals, Not Proof)
-- ==============================================================================

-- 1. STUDY SESSIONS (Tracks genuine active learning time, filters idle tabs)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id UUID,
  topic TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('reading', 'practice', 'ai_interaction', 'teach_back', 'test_prep')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  active_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONCEPT MASTERY (Separates Memory/Recall from Conceptual Understanding)
CREATE TABLE IF NOT EXISTS concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  recall_score INT DEFAULT 0 CHECK (recall_score BETWEEN 0 AND 100),
  understanding_score INT DEFAULT 0 CHECK (understanding_score BETWEEN 0 AND 100),
  mastery_level TEXT NOT NULL DEFAULT 'emerging' CHECK (mastery_level IN ('emerging', 'developing', 'proficient', 'mastered')),
  teach_backs_completed INT DEFAULT 0,
  misconceptions_count INT DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, topic)
);

-- 3. TEACH-BACK SUBMISSIONS ("Explain it to NOVA" evaluation history)
CREATE TABLE IF NOT EXISTS teach_back_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  student_explanation TEXT NOT NULL,
  input_mode TEXT NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
  key_concepts_covered JSONB DEFAULT '[]'::jsonb,
  recall_score INT NOT NULL DEFAULT 0 CHECK (recall_score BETWEEN 0 AND 100),
  understanding_score INT NOT NULL DEFAULT 0 CHECK (understanding_score BETWEEN 0 AND 100),
  cause_effect_score INT NOT NULL DEFAULT 0 CHECK (cause_effect_score BETWEEN 0 AND 100),
  reasoning_score INT NOT NULL DEFAULT 0 CHECK (reasoning_score BETWEEN 0 AND 100),
  in_own_words_score INT NOT NULL DEFAULT 0 CHECK (in_own_words_score BETWEEN 0 AND 100),
  misconceptions_detected JSONB DEFAULT '[]'::jsonb,
  missing_concepts JSONB DEFAULT '[]'::jsonb,
  nova_feedback TEXT NOT NULL,
  follow_up_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEARNING BADGES (Awarded based on verifiable learning evidence)
CREATE TABLE IF NOT EXISTS learning_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('CONCEPT_MASTER', 'DEEP_THINKER', 'GREAT_EXPLAINER', 'CURIOUS_MIND', 'LEARNING_IMPROVER', 'TEACH_BACK_CHAMPION', 'TOPIC_MASTERY')),
  badge_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_met JSONB NOT NULL DEFAULT '[]'::jsonb,
  topic TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOVA CONVERSATIONS (Multi-turn session state)
CREATE TABLE IF NOT EXISTS nova_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic TEXT,
  session_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEST INTEGRITY EVENTS (Objective signals for teacher review — never automated guilt)
CREATE TABLE IF NOT EXISTS test_integrity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('face_not_detected', 'multiple_persons_detected', 'repeated_looking_away', 'tab_switched')),
  details JSONB DEFAULT '{}'::jsonb,
  reviewed_by_teacher BOOLEAN DEFAULT FALSE,
  teacher_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_study_sessions_student ON study_sessions(student_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_student ON concept_mastery(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_teach_back_student ON teach_back_submissions(student_id, topic);
CREATE INDEX IF NOT EXISTS idx_learning_badges_student ON learning_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_nova_conversations_student ON nova_conversations(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_test_integrity_test ON test_integrity_events(test_id, student_id);

-- ROW LEVEL SECURITY POLICIES
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE teach_back_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_integrity_events ENABLE ROW LEVEL SECURITY;

-- Students can read their own study records
CREATE POLICY "Students can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own concept mastery" ON concept_mastery
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own teach-back submissions" ON teach_back_submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own badges" ON learning_badges
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own nova conversations" ON nova_conversations
  FOR ALL USING (auth.uid() = student_id);
