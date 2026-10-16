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
  role: 'teacher' | 'student' | 'admin' | 'parent';
  id_number?: string;
  class_id?: string;
  class_name?: string;
  section_id?: string;
  section_name?: string;
  phone?: string;
  avatar_url?: string;
  school_id?: string;
  dob?: string;
  gender?: string;
  parent_name?: string;
  parent_phone?: string;
  children?: StudentChild[];
  achievement_badges?: AchievementBadgeSummary[];
}

export interface StudentChild {
  id: string;
  student_id: string;
  full_name: string;
  student_name: string;
  id_number: string;
  class_id: string;
  class_name: string;
  section_id?: string;
  section_name?: string;
  roll_number?: string;
  avatar_url?: string;
  mentor_name?: string;
  relationship?: string;
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
  sections?: Section[];
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

// ================= SMART SCHOOL ECOSYSTEM TYPES =================

export interface School {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  affiliation_number?: string;
  academic_year: string;
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  name: string; // e.g. "A", "B", "C"
  full_name?: string; // e.g. "1-A"
  room_number?: string;
  capacity?: number;
  is_active: boolean;
  mentor_id?: string;
  mentor_name?: string;
  mentor_email?: string;
  students_count?: number;
}

export interface Subject {
  id: string;
  school_id?: string;
  code?: string;
  name: string;
  department?: string;
  class_ids?: string[];
  is_active: boolean;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  teacher_id: string;
  teacher_name?: string;
  teacher_email?: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  subject_id: string;
  subject_name?: string;
  is_active: boolean;
}

export interface SectionMentor {
  id: string;
  school_id: string;
  section_id: string;
  section_name?: string;
  teacher_id: string;
  teacher_name?: string;
  academic_year?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'leave';

export interface AttendanceRecord {
  id: string;
  school_id?: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  subject_id?: string;
  subject_name?: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  roll_number?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  marked_by_name?: string;
  recorded_by?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  percentage: number;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  instructions?: string;
  due_date: string;
  max_marks: number;
  attachments?: string[];
  created_at: string;
  submissions_count?: number;
  total_students?: number;
  submissions?: HomeworkSubmission[];
  my_submission?: HomeworkSubmission;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  content?: string;
  submission_text?: string;
  attachments?: string[];
  submitted_at: string;
  status: 'submitted' | 'evaluated' | 'resubmit_requested' | 'graded';
  marks_obtained?: number;
  feedback?: string;
  evaluated_by?: string;
  evaluated_at?: string;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  title: string;
  exam_type: 'unit_test' | 'mid_term' | 'quarterly' | 'half_yearly' | 'annual' | 'custom' | string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_published: boolean;
  subjects?: ExamSubject[];
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_id: string;
  subject_name?: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
}

export interface MarkEntry {
  id: string;
  exam_id: string;
  exam_title?: string;
  subject_id: string;
  subject_name?: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  class_id?: string;
  section_id?: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  comments?: string;
  entered_at?: string;
}

export interface TimetableSlot {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: string | number;
  period_number?: number;
  start_time: string;
  end_time: string;
  room?: string;
  room_number?: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  title: string;
  amount: number;
  due_date: string;
  academic_year: string;
}

export interface StudentFeeRecord {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  class_id?: string;
  section_id?: string;
  fee_structure_id: string;
  title: string;
  total_amount: number;
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
  last_payment_date?: string;
}

export interface FeePayment {
  id: string;
  student_fee_id: string;
  student_id: string;
  amount: number;
  payment_method: string;
  payment_mode?: string;
  transaction_ref?: string;
  receipt_number: string;
  paid_at: string;
}

export interface SchoolNotification {
  id: string;
  school_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'homework' | 'marks' | 'attendance' | 'fee' | 'exam' | 'announcement' | 'general' | string;
  target_url?: string;
  target_role?: string;
  is_read: boolean;
  created_at: string;
}

export interface ParentTeacherMessage {
  id: string;
  school_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  receiver_id: string;
  receiver_name?: string;
  student_id: string;
  student_name?: string;
  subject_id?: string;
  subject_name?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  user_id?: string;
  user_role?: string;
  target_id?: string;
  created_at: string;
}

export interface CsvPreviewRow {
  row_number: number;
  raw: Record<string, string>;
  is_valid: boolean;
  errors: string[];
}

export interface CsvImportResult {
  success: boolean;
  entity_type: string;
  total_rows: number;
  imported_count: number;
  failed_count: number;
  assignments_created?: number;
  errors: Array<{ row: number; reason?: string; message?: string; data?: any }>;
  summary: string;
}

export interface StudentReportCard {
  student: {
    id: string;
    full_name: string;
    id_number: string;
    class_id: string;
    section_id: string;
  };
  marks: MarkEntry[];
  total_obtained: number;
  total_max: number;
  overall_percentage: number;
  overall_grade: string;
  attendance_percentage: number;
}


