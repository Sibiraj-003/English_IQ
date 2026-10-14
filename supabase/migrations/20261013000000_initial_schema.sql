-- Enable pgvector extension for semantic textbook embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  class_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKS
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  page_count INT DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOK_PAGES
CREATE TABLE IF NOT EXISTS book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  raw_text TEXT,
  ocr_text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHAPTERS
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LESSONS
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  grammar_topics JSONB DEFAULT '[]'::jsonb,
  vocabulary JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'Easy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TEXT_CHUNKS (with vector embeddings)
CREATE TABLE IF NOT EXISTS text_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  page_number INT,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GRAMMAR_TOPICS
CREATE TABLE IF NOT EXISTS grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  explanation TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'Easy',
  topic TEXT,
  source_page INT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TESTS
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 15,
  total_questions INT DEFAULT 10,
  published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TEST_QUESTIONS
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  question_order INT NOT NULL
);

-- 13. STUDENT_ATTEMPTS
CREATE TABLE IF NOT EXISTS student_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  percentage INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken INT DEFAULT 0
);

-- 14. STUDENT_ANSWERS
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  marks INT DEFAULT 0,
  feedback TEXT
);

-- 15. STUDENT_PROGRESS
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completion_percentage INT DEFAULT 0,
  last_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. WEAK_TOPICS
CREATE TABLE IF NOT EXISTS weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  accuracy INT DEFAULT 0,
  recommended_action TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE & ISOLATION INDEXES
CREATE INDEX IF NOT EXISTS idx_chunks_class_book ON text_chunks (class_id, book_id);
CREATE INDEX IF NOT EXISTS idx_questions_class_book ON questions (class_id, book_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);
CREATE INDEX IF NOT EXISTS idx_tests_class_published ON tests (class_id, published);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON student_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_weak_topics_student ON weak_topics (student_id);

-- VECTOR SIMILARITY SEARCH WITH STRICT CURRICULUM ISOLATION
CREATE OR REPLACE FUNCTION match_text_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  target_class_id uuid,
  target_book_id uuid
)
RETURNS TABLE (
  id uuid,
  book_id uuid,
  class_id uuid,
  chapter_id uuid,
  lesson_id uuid,
  content text,
  page_number int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.book_id,
    tc.class_id,
    tc.chapter_id,
    tc.lesson_id,
    tc.content,
    tc.page_number,
    1 - (tc.embedding <=> query_embedding) AS similarity
  FROM text_chunks tc
  WHERE tc.class_id = target_class_id
    AND tc.book_id = target_book_id
    AND 1 - (tc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
