export interface AchievementBadgeSummary {
  id: string;
  name: string;
  type: string;
  unlocked: boolean;
  description: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  id_number?: string;
  class_id?: string;
  avatar_url?: string;
  achievement_badges?: AchievementBadgeSummary[];
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  description: string;
  books_count?: number;
  lessons_count?: number;
  students_count?: number;
  tests_count?: number;
  avg_score?: number;
}

export interface Book {
  id: string;
  class_id: string;
  subject_id: string;
  title: string;
  description: string;
  file_url?: string;
  file_name: string;
  page_count: number;
  processing_status:
    | 'upload_pending'
    | 'uploaded'
    | 'processing'
    | 'extracting_text'
    | 'ocr_processing'
    | 'structuring_book'
    | 'indexing'
    | 'book_ready'
    | 'processing_failed'
    | 'processed'
    | 'failed';
  uploaded_by?: string;
  created_at: string;
  chapters?: Chapter[];
  lessons?: Lesson[];
  grammar_topics?: GrammarTopic[];
  vocabulary?: string[];
  chunks_count?: number;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  chapter_number: number;
  summary: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  book_id?: string;
  title: string;
  content: string;
  summary: string;
  grammar_topics: string[];
  vocabulary: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chapter_title?: string;
  book_title?: string;
  source_page?: number;
  questions?: Question[];
}

export interface GrammarTopic {
  id: string;
  class_id: string;
  book_id: string;
  lesson_id?: string;
  topic: string;
  explanation: string;
  examples: string[];
}

export interface Question {
  id: string;
  class_id: string;
  book_id: string;
  lesson_id?: string;
  question_type: 'MCQ' | 'fill_in_the_blanks' | 'true_false' | 'short_answer';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  source_page: number;
  book_title?: string;
  status: 'draft' | 'approved' | 'published';
  created_at: string;
}

export interface Test {
  id: string;
  class_id: string;
  book_id: string;
  lesson_id?: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
  published: boolean;
  question_ids: string[];
  questions?: Question[];
  created_at: string;
  submissions_count?: number;
  total_enrolled?: number;
  all_students_completed?: boolean;
  completion_percentage?: number;
  average_score?: number;
  top_ranked?: StudentRankItem[];
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  test_id: string;
  score: number;
  percentage: number;
  started_at: string;
  completed_at: string;
  time_taken: number;
  answers: {
    question_id: string;
    question_text?: string;
    question?: string;
    options?: string[];
    correct_answer?: string;
    explanation?: string;
    answer: string;
    is_correct: boolean;
    marks: number;
    feedback: string;
    topic: string;
  }[];
}

export interface StudentProgressData {
  student_id: string;
  student_name: string;
  learning_progress_percent: number;
  lessons_completed: string;
  completed_lessons_count?: number;
  total_lessons_count?: number;
  remaining_lessons_count?: number;
  average_score: number;
  current_streak_days: number;
  recent_attempts: StudentAttempt[];
  topic_mastery: { topic: string; accuracy: number; totalQuestions: number }[];
  score_trends: { date: string; score: number }[];
  weak_topics: { id?: string; topic: string; accuracy: number; recommended_action: string }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    icon: string;
    category?: string;
    badge_type?: string;
    points?: number;
  }[];
}

export interface StudentRankItem {
  rank: number;
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_id_number: string;
  test_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds?: number;
  completed_at: string;
  grade: string;
  status: string;
}

export interface ClassAnalyticsData {
  class_id: string;
  class_name: string;
  average_score: number;
  active_students: number;
  tests_completed: number;
  weakest_topic: {
    topic: string;
    accuracy: number;
    recommendation: string;
  };
  topic_performance: { topic: string; accuracy: number; status: string }[];
  score_distribution: { range: string; count: number }[];
  most_difficult_questions: { question: string; failure_rate: string; topic: string }[];
  student_rankings?: StudentRankItem[];
}

export interface AiTeacherResponse {
  answer: string;
  sourceBadge?: {
    bookTitle: string;
    pageNumber: number;
    lessonTitle?: string;
  };
  suggestedFollowUps?: string[];
  mode: string;
}
