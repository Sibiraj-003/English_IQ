import { vectorStore } from '../rag/vectorStore.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

// ================= TYPES & INTERFACES =================

export interface Profile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin' | 'parent';
  id_number?: string;
  class_id?: string;
  class_name?: string;
  section_id?: string;
  section_name?: string;
  school_id?: string;
  batch?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  parent_name?: string;
  parent_phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

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

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  description: string;
  student_count?: number;
  avg_score?: number;
  created_at: string;
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string; // "A", "B", "C"
  full_name: string; // e.g. "1-A"
  room_number?: string;
  capacity?: number;
  is_active: boolean;
  mentor_id?: string;
  mentor_name?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id?: string;
  code?: string;
  name: string;
  department?: string;
  class_ids?: string[];
  is_active: boolean;
  created_at: string;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  is_active: boolean;
  created_at: string;
}

export interface SectionMentor {
  id: string;
  school_id: string;
  section_id: string;
  teacher_id: string;
  academic_year: string;
  assigned_at: string;
}

export interface ParentStudent {
  id: string;
  school_id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id?: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
  marked_by?: string;
  created_at: string;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  attachments?: string[];
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content?: string;
  attachments?: string[];
  submitted_at: string;
  status: 'submitted' | 'evaluated' | 'resubmit_requested';
  marks_obtained?: number;
  feedback?: string;
  evaluated_by?: string;
  evaluated_at?: string;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  title: string;
  exam_type: 'unit_test' | 'mid_term' | 'quarterly' | 'half_yearly' | 'annual' | 'custom';
  start_date: string;
  end_date: string;
  academic_year: string;
  is_published: boolean;
  created_at: string;
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
}

export interface MarkEntry {
  id: string;
  school_id: string;
  exam_id: string;
  subject_id: string;
  student_id: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  entered_by?: string;
  entered_at: string;
}

export interface TimetableSlot {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number; // 1 = Monday ... 6 = Saturday
  period_number: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  title: string;
  amount: number;
  due_date: string;
  academic_year: string;
}

export interface StudentFeeRecord {
  id: string;
  school_id: string;
  student_id: string;
  fee_structure_id: string;
  total_amount: number;
  paid_amount: number;
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
  type: 'homework' | 'marks' | 'attendance' | 'fee' | 'exam' | 'announcement' | 'general';
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ParentTeacherMessage {
  id: string;
  school_id: string;
  sender_id: string;
  receiver_id: string;
  student_id: string;
  subject_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  school_id: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

// ================= NOVA AI ARCHITECTURE DATA MODELS =================
export interface StudySession {
  id: string;
  student_id: string;
  school_id: string;
  class_id?: string;
  section_id?: string;
  subject_id?: string;
  chapter_id?: string;
  topic: string;
  activity_type: 'reading' | 'practice' | 'ai_interaction' | 'teach_back' | 'test_prep';
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  active_seconds: number;
  created_at: string;
}

export interface ConceptMastery {
  id: string;
  student_id: string;
  subject_id: string;
  topic: string;
  recall_score: number;
  understanding_score: number;
  mastery_level: 'emerging' | 'developing' | 'proficient' | 'mastered';
  teach_backs_completed: number;
  misconceptions_count: number;
  last_evaluated_at: string;
  created_at: string;
}

export interface TeachBackSubmission {
  id: string;
  student_id: string;
  subject_id: string;
  topic: string;
  student_explanation: string;
  input_mode: 'text' | 'voice';
  key_concepts_covered: string[];
  recall_score: number;
  understanding_score: number;
  cause_effect_score: number;
  reasoning_score: number;
  in_own_words_score: number;
  misconceptions_detected: string[];
  missing_concepts: string[];
  nova_feedback: string;
  follow_up_questions: string[];
  created_at: string;
}

export interface LearningBadge {
  id: string;
  student_id: string;
  badge_type: 'CONCEPT_MASTER' | 'DEEP_THINKER' | 'GREAT_EXPLAINER' | 'CURIOUS_MIND' | 'LEARNING_IMPROVER' | 'TEACH_BACK_CHAMPION' | 'TOPIC_MASTERY';
  badge_name: string;
  description: string;
  icon: string;
  criteria_met: string[];
  topic?: string;
  subject_id?: string;
  earned_at: string;
}

export interface NovaConversation {
  id: string;
  student_id: string;
  subject_id?: string;
  topic?: string;
  session_id?: string;
  messages: Array<{
    role: 'student' | 'nova';
    content: string;
    expression?: string;
    sourceBadge?: any;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TestIntegrityEvent {
  id: string;
  student_id: string;
  test_id: string;
  event_type: 'face_not_detected' | 'multiple_persons_detected' | 'repeated_looking_away' | 'tab_switched';
  details?: Record<string, any>;
  reviewed_by_teacher?: boolean;
  teacher_notes?: string;
  timestamp: string;
  created_at: string;
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
  updated_at: string;
}

export interface BookPage {
  id: string;
  book_id: string;
  page_number: number;
  raw_text: string;
  ocr_text?: string;
  image_url?: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  chapter_number: number;
  summary: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  chapter_id?: string;
  book_id?: string;
  title: string;
  content: string;
  summary?: string;
  grammar_topics?: string[];
  vocabulary?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
}

export interface GrammarTopic {
  id: string;
  book_id?: string;
  lesson_id?: string;
  topic_name: string;
  description: string;
  examples: string[];
  created_at: string;
}

export interface Question {
  id: string;
  book_id?: string;
  lesson_id?: string;
  class_id: string;
  topic: string;
  question_text: string;
  question_type: 'MCQ' | 'fill_in_the_blanks' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'draft' | 'approved' | 'published' | 'rejected';
  source_page?: number;
  source_chunk_id?: string;
  created_by?: string;
  created_at: string;
}

export interface Test {
  id: string;
  class_id: string;
  book_id?: string;
  lesson_id?: string;
  title: string;
  description: string;
  total_questions?: number;
  total_marks?: number;
  passing_marks?: number;
  duration_minutes: number;
  published: boolean;
  question_ids?: string[];
  questions?: Question[];
  created_by?: string;
  created_at: string;
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
  answers?: {
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

export interface StudentProgress {
  id: string;
  student_id: string;
  class_id: string;
  lesson_id: string;
  completion_percentage: number;
  last_score: number;
  updated_at: string;
}

export interface WeakTopic {
  id: string;
  student_id: string;
  topic: string;
  accuracy: number;
  recommended_action: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  type: 'AI_CHAT' | 'BOOK_UPLOAD' | 'TEST_SUBMIT' | 'QUESTION_GEN' | 'QUESTION_APPROVE' | 'PRACTICE';
  message: string;
  meta?: any;
  timestamp: string;
}

// ================= DATABASE STORE CLASS =================

export class DatabaseStore {
  // 1. Schools
  schools: School[] = [
    {
      id: 'SCH001',
      code: 'OAKRIDGE',
      name: 'Oakridge Smart International School',
      address: '42 Academic Boulevard, Knowledge City',
      phone: '+91 98765 43210',
      email: 'principal@oakridge.edu',
      affiliation_number: 'CBSE-93821',
      academic_year: '2025-2026',
    },
  ];

  // 2. Classes (Class 1 to Class 12)
  classes: SchoolClass[] = [
    { id: 'CLS001', name: 'Class 1', grade: 1, description: 'Primary Grade 1 - Early Foundations, Phonics & Basic Skills', student_count: 2, avg_score: 82, created_at: new Date().toISOString() },
    { id: 'CLS002', name: 'Class 2', grade: 2, description: 'Primary Grade 2 - Sentence Construction, Vocabulary & Arithmetic', student_count: 1, avg_score: 85, created_at: new Date().toISOString() },
    { id: 'CLS003', name: 'Class 3', grade: 3, description: 'Primary Grade 3 - Parts of Speech, Environmental Studies & Math', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS004', name: 'Class 4', grade: 4, description: 'Grade 4 - Intermediate Grammar, Social Science & Science', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS005', name: 'Class 5', grade: 5, description: 'Grade 5 - Advanced Primary Curriculum & Literature', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS006', name: 'Class 6', grade: 6, description: 'Grade 6 - Middle School Foundations & General Science', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS007', name: 'Class 7', grade: 7, description: 'Grade 7 - Middle School Algebra, Chemistry & World History', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS008', name: 'Class 8', grade: 8, description: 'Grade 8 - Pre-Secondary Science, Geometry & Languages', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS009', name: 'Class 9', grade: 9, description: 'Grade 9 - Secondary Board Preparation & Sciences', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS010', name: 'Class 10', grade: 10, description: 'Grade 10 - Secondary Board Examinations Curriculum', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS011', name: 'Class 11', grade: 11, description: 'Higher Secondary Grade 11 - Sciences & Mathematics', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS012', name: 'Class 12', grade: 12, description: 'Higher Secondary Grade 12 - Senior Board Examinations', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
  ];

  // 3. Dynamic Sections
  sections: Section[] = [
    // Class 1 Sections
    { id: 'SEC-1A', school_id: 'SCH001', class_id: 'CLS001', name: 'A', full_name: '1-A', room_number: 'Room 101', capacity: 35, is_active: true, mentor_id: 'tch-primary-001', mentor_name: 'Priya Sharma (Teacher)', created_at: new Date().toISOString() },
    { id: 'SEC-1B', school_id: 'SCH001', class_id: 'CLS001', name: 'B', full_name: '1-B', room_number: 'Room 102', capacity: 35, is_active: true, mentor_id: 'tch-primary-004', mentor_name: 'Anitha George (Teacher)', created_at: new Date().toISOString() },
    { id: 'SEC-1C', school_id: 'SCH001', class_id: 'CLS001', name: 'C', full_name: '1-C', room_number: 'Room 103', capacity: 35, is_active: true, created_at: new Date().toISOString() },

    // Class 2 Sections
    { id: 'SEC-2A', school_id: 'SCH001', class_id: 'CLS002', name: 'A', full_name: '2-A', room_number: 'Room 201', capacity: 35, is_active: true, mentor_id: 'tch-primary-002', mentor_name: 'Ravi Varma (Teacher)', created_at: new Date().toISOString() },
    { id: 'SEC-2B', school_id: 'SCH001', class_id: 'CLS002', name: 'B', full_name: '2-B', room_number: 'Room 202', capacity: 35, is_active: true, created_at: new Date().toISOString() },

    // Class 3 Sections
    { id: 'SEC-3A', school_id: 'SCH001', class_id: 'CLS003', name: 'A', full_name: '3-A', room_number: 'Room 301', capacity: 35, is_active: true, created_at: new Date().toISOString() },
    { id: 'SEC-3B', school_id: 'SCH001', class_id: 'CLS003', name: 'B', full_name: '3-B', room_number: 'Room 302', capacity: 35, is_active: true, created_at: new Date().toISOString() },
  ];

  // 4. Subjects Catalogue (Multi-Subject)
  subjects: Subject[] = [
    { id: 'sub-eng', school_id: 'SCH001', code: 'ENG101', name: 'English', department: 'Languages', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-mat', school_id: 'SCH001', code: 'MAT101', name: 'Mathematics', department: 'Mathematics', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-sci', school_id: 'SCH001', code: 'SCI101', name: 'Science', department: 'Science', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-soc', school_id: 'SCH001', code: 'SOC101', name: 'Social Science', department: 'Social Studies', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-tam', school_id: 'SCH001', code: 'TAM101', name: 'Tamil', department: 'Languages', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-hin', school_id: 'SCH001', code: 'HIN101', name: 'Hindi', department: 'Languages', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-cs', school_id: 'SCH001', code: 'CSC101', name: 'Computer Science', department: 'Technology', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-phy', school_id: 'SCH001', code: 'PHY101', name: 'Physics', department: 'Science', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-che', school_id: 'SCH001', code: 'CHE101', name: 'Chemistry', department: 'Science', is_active: true, created_at: new Date().toISOString() },
    { id: 'sub-bio', school_id: 'SCH001', code: 'BIO101', name: 'Biology', department: 'Science', is_active: true, created_at: new Date().toISOString() },
  ];

  // 5. Profiles (Admin, Teachers, Students, Parents)
  profiles: Profile[] = [
    // Admin
    {
      id: 'admin-primary-001',
      user_id: 'ADM1001',
      full_name: 'School Administrator',
      email: 'admin@englishiq.app',
      role: 'admin',
      id_number: 'ADM1001',
      school_id: 'SCH001',
      phone: '+91 94444 00001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Teacher 1: Priya Sharma (English + Mentor for 1-A)
    {
      id: 'tch-primary-001',
      user_id: 'TCH1001',
      full_name: 'Priya Sharma (Teacher)',
      email: 'teacher@englishiq.app',
      role: 'teacher',
      id_number: 'TCH1001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1A',
      section_name: '1-A',
      phone: '+91 94444 10001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Teacher 2: Ravi Varma (Mathematics for 1-A & 2-A)
    {
      id: 'tch-primary-002',
      user_id: 'TCH1002',
      full_name: 'Ravi Varma (Math Specialist)',
      email: 'ravi.varma@englishiq.app',
      role: 'teacher',
      id_number: 'TCH1002',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1A',
      section_name: '1-A',
      phone: '+91 94444 10002',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Teacher 3: Suresh Raina (Science for 1-A & 1-B)
    {
      id: 'tch-primary-003',
      user_id: 'TCH1003',
      full_name: 'Suresh Raina (Science Teacher)',
      email: 'suresh.raina@englishiq.app',
      role: 'teacher',
      id_number: 'TCH1003',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1A',
      section_name: '1-A',
      phone: '+91 94444 10003',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Teacher 4: Anitha George (English + Mentor for 1-B)
    {
      id: 'tch-primary-004',
      user_id: 'TCH1004',
      full_name: 'Anitha George (Teacher)',
      email: 'anitha.george@englishiq.app',
      role: 'teacher',
      id_number: 'TCH1004',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1B',
      section_name: '1-B',
      phone: '+91 94444 10004',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Student 1: Aarav Kumar (1-A)
    {
      id: 'stu-primary-001',
      user_id: 'STU10001',
      full_name: 'Aarav Kumar (Student)',
      email: 'student@englishiq.app',
      role: 'student',
      id_number: 'STU10001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1A',
      section_name: '1-A',
      batch: 'Batch 2025-2026',
      gender: 'Male',
      dob: '2018-05-14',
      parent_name: 'Rajesh Kumar',
      parent_phone: '+91 98888 11111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Student 2: Diya Lakshmi (1-A)
    {
      id: 'stu-primary-002',
      user_id: 'STU10002',
      full_name: 'Diya Lakshmi',
      email: 'diya.lakshmi@englishiq.app',
      role: 'student',
      id_number: 'STU10002',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1A',
      section_name: '1-A',
      batch: 'Batch 2025-2026',
      gender: 'Female',
      dob: '2018-08-22',
      parent_name: 'Lakshmi Narayanan',
      parent_phone: '+91 98888 22222',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Student 3: Rohan Patel (1-B)
    {
      id: 'stu-primary-003',
      user_id: 'STU10003',
      full_name: 'Rohan Patel',
      email: 'rohan.patel@englishiq.app',
      role: 'student',
      id_number: 'STU10003',
      school_id: 'SCH001',
      class_id: 'CLS001',
      class_name: 'Class 1',
      section_id: 'SEC-1B',
      section_name: '1-B',
      batch: 'Batch 2025-2026',
      gender: 'Male',
      dob: '2018-03-10',
      parent_name: 'Vikram Patel',
      parent_phone: '+91 98888 33333',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Student 4: Ananya Sharma (2-A) - second child of Rajesh Kumar
    {
      id: 'stu-primary-004',
      user_id: 'STU10004',
      full_name: 'Ananya Sharma',
      email: 'ananya.sharma@englishiq.app',
      role: 'student',
      id_number: 'STU10004',
      school_id: 'SCH001',
      class_id: 'CLS002',
      class_name: 'Class 2',
      section_id: 'SEC-2A',
      section_name: '2-A',
      batch: 'Batch 2025-2026',
      gender: 'Female',
      dob: '2017-09-18',
      parent_name: 'Rajesh Kumar',
      parent_phone: '+91 98888 11111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Parent: Rajesh Kumar (Parent of Aarav Kumar 1-A & Ananya Sharma 2-A)
    {
      id: 'par-primary-001',
      user_id: 'PAR1001',
      full_name: 'Rajesh Kumar (Parent)',
      email: 'parent@englishiq.app',
      role: 'parent',
      id_number: 'PAR1001',
      school_id: 'SCH001',
      phone: '+91 98888 11111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 6. Section Mentors (Priya -> 1-A, Anitha -> 1-B, Ravi -> 2-A)
  section_mentors: SectionMentor[] = [
    { id: 'men-001', school_id: 'SCH001', section_id: 'SEC-1A', teacher_id: 'tch-primary-001', academic_year: '2025-2026', assigned_at: new Date().toISOString() },
    { id: 'men-002', school_id: 'SCH001', section_id: 'SEC-1B', teacher_id: 'tch-primary-004', academic_year: '2025-2026', assigned_at: new Date().toISOString() },
    { id: 'men-003', school_id: 'SCH001', section_id: 'SEC-2A', teacher_id: 'tch-primary-002', academic_year: '2025-2026', assigned_at: new Date().toISOString() },
  ];

  // 7. Teacher Assignments (Strict Scope: School + Class + Section + Subject)
  teacher_assignments: TeacherAssignment[] = [
    // Priya Sharma: 1-A English
    { id: 'ta-001', school_id: 'SCH001', teacher_id: 'tch-primary-001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-eng', is_active: true, created_at: new Date().toISOString() },
    // Ravi Varma: 1-A Mathematics, 2-A Mathematics
    { id: 'ta-002', school_id: 'SCH001', teacher_id: 'tch-primary-002', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-mat', is_active: true, created_at: new Date().toISOString() },
    { id: 'ta-003', school_id: 'SCH001', teacher_id: 'tch-primary-002', class_id: 'CLS002', section_id: 'SEC-2A', subject_id: 'sub-mat', is_active: true, created_at: new Date().toISOString() },
    // Suresh Raina: 1-A Science, 1-B Science
    { id: 'ta-004', school_id: 'SCH001', teacher_id: 'tch-primary-003', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-sci', is_active: true, created_at: new Date().toISOString() },
    { id: 'ta-005', school_id: 'SCH001', teacher_id: 'tch-primary-003', class_id: 'CLS001', section_id: 'SEC-1B', subject_id: 'sub-sci', is_active: true, created_at: new Date().toISOString() },
    // Anitha George: 1-B English
    { id: 'ta-006', school_id: 'SCH001', teacher_id: 'tch-primary-004', class_id: 'CLS001', section_id: 'SEC-1B', subject_id: 'sub-eng', is_active: true, created_at: new Date().toISOString() },
  ];

  // 8. Parent Students (Multi-child mapping)
  parent_students: ParentStudent[] = [
    { id: 'ps-001', school_id: 'SCH001', parent_id: 'par-primary-001', student_id: 'stu-primary-001', relationship: 'Father', is_primary: true },
    { id: 'ps-002', school_id: 'SCH001', parent_id: 'par-primary-001', student_id: 'stu-primary-004', relationship: 'Father', is_primary: true },
  ];

  // 9. Attendance Records
  attendance: AttendanceRecord[] = [
    // Aarav Kumar (1-A)
    { id: 'att-001', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-001', date: '2026-10-14', status: 'present', remarks: 'On time', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },
    { id: 'att-002', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-001', date: '2026-10-15', status: 'present', remarks: 'On time', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },
    { id: 'att-003', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-001', date: '2026-10-16', status: 'present', remarks: 'Present in class', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },

    // Diya Lakshmi (1-A)
    { id: 'att-004', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-002', date: '2026-10-14', status: 'present', remarks: 'On time', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },
    { id: 'att-005', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-002', date: '2026-10-15', status: 'late', remarks: '15 mins late due to bus delay', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },
    { id: 'att-006', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', student_id: 'stu-primary-002', date: '2026-10-16', status: 'present', remarks: 'Active participation', marked_by: 'tch-primary-001', created_at: new Date().toISOString() },

    // Rohan Patel (1-B)
    { id: 'att-007', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1B', student_id: 'stu-primary-003', date: '2026-10-16', status: 'present', remarks: 'Present', marked_by: 'tch-primary-004', created_at: new Date().toISOString() },

    // Ananya Sharma (2-A)
    { id: 'att-008', school_id: 'SCH001', class_id: 'CLS002', section_id: 'SEC-2A', student_id: 'stu-primary-004', date: '2026-10-16', status: 'present', remarks: 'On time', marked_by: 'tch-primary-002', created_at: new Date().toISOString() },
  ];

  // 10. Homework & Assignments
  homework: Homework[] = [
    {
      id: 'hw-001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-eng',
      teacher_id: 'tch-primary-001',
      title: 'Noun Identification & Sentence Construction',
      description: 'Underline all the naming words (nouns) in Lesson 1 paragraph 3 and write 5 sentences using each noun.',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      max_marks: 10,
      attachments: ['https://englishiq.app/uploads/noun_worksheet.pdf'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'hw-002',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-mat',
      teacher_id: 'tch-primary-002',
      title: 'Addition of Single Digit Numbers Practice',
      description: 'Complete practice problems 1 to 10 on page 24 of your Mathematics workbook.',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      max_marks: 10,
      attachments: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'hw-003',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-sci',
      teacher_id: 'tch-primary-003',
      title: 'Parts of a Plant Drawing & Labeling',
      description: 'Draw a flowering plant in your science notebook and clearly label: Root, Stem, Leaf, Flower, and Fruit.',
      due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
      max_marks: 10,
      attachments: [],
      created_at: new Date().toISOString(),
    },
  ];

  // 11. Homework Submissions
  homework_submissions: HomeworkSubmission[] = [
    {
      id: 'hws-001',
      homework_id: 'hw-001',
      student_id: 'stu-primary-001',
      content: 'I completed identifying the 5 nouns: Dog, Park, Tree, Ball, and Sun. My sentences are written clearly.',
      attachments: ['noun_assignment_aarav.pdf'],
      submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'evaluated',
      marks_obtained: 9,
      feedback: 'Excellent work Aarav! Beautiful handwriting and correct noun usage.',
      evaluated_by: 'tch-primary-001',
      evaluated_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  // 12. Exams
  exams: Exam[] = [
    {
      id: 'exam-001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      title: 'Mid-Term Assessment 2025',
      exam_type: 'mid_term',
      start_date: '2026-10-20',
      end_date: '2026-10-25',
      academic_year: '2025-2026',
      is_published: true,
      created_at: new Date().toISOString(),
    },
  ];

  // 13. Exam Subjects Schedule
  exam_subjects: ExamSubject[] = [
    { id: 'es-001', exam_id: 'exam-001', subject_id: 'sub-eng', exam_date: '2026-10-20', start_time: '09:30', duration_minutes: 60, max_marks: 50, passing_marks: 20 },
    { id: 'es-002', exam_id: 'exam-001', subject_id: 'sub-mat', exam_date: '2026-10-22', start_time: '09:30', duration_minutes: 60, max_marks: 50, passing_marks: 20 },
    { id: 'es-003', exam_id: 'exam-001', subject_id: 'sub-sci', exam_date: '2026-10-24', start_time: '09:30', duration_minutes: 60, max_marks: 50, passing_marks: 20 },
  ];

  // 14. Marks Entry
  marks: MarkEntry[] = [
    // Aarav Kumar (1-A)
    { id: 'mrk-001', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-eng', student_id: 'stu-primary-001', marks_obtained: 44, max_marks: 50, percentage: 88, grade: 'A', remarks: 'Very good vocabulary and grammar', entered_by: 'tch-primary-001', entered_at: new Date().toISOString() },
    { id: 'mrk-002', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-mat', student_id: 'stu-primary-001', marks_obtained: 47, max_marks: 50, percentage: 94, grade: 'A+', remarks: 'Outstanding mathematical reasoning', entered_by: 'tch-primary-002', entered_at: new Date().toISOString() },
    { id: 'mrk-003', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-sci', student_id: 'stu-primary-001', marks_obtained: 42, max_marks: 50, percentage: 84, grade: 'A', remarks: 'Good scientific concepts', entered_by: 'tch-primary-003', entered_at: new Date().toISOString() },

    // Diya Lakshmi (1-A)
    { id: 'mrk-004', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-eng', student_id: 'stu-primary-002', marks_obtained: 48, max_marks: 50, percentage: 96, grade: 'A+', remarks: 'Top marks in English comprehension', entered_by: 'tch-primary-001', entered_at: new Date().toISOString() },
    { id: 'mrk-005', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-mat', student_id: 'stu-primary-002', marks_obtained: 45, max_marks: 50, percentage: 90, grade: 'A+', remarks: 'Accurate calculations', entered_by: 'tch-primary-002', entered_at: new Date().toISOString() },
    { id: 'mrk-006', school_id: 'SCH001', exam_id: 'exam-001', subject_id: 'sub-sci', student_id: 'stu-primary-002', marks_obtained: 46, max_marks: 50, percentage: 92, grade: 'A+', remarks: 'Impressive diagrams and answers', entered_by: 'tch-primary-003', entered_at: new Date().toISOString() },
  ];

  // 15. Timetables (Conflict-free timetable for Section 1-A)
  timetables: TimetableSlot[] = [
    // Monday
    { id: 'tt-001', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-eng', teacher_id: 'tch-primary-001', day_of_week: 1, period_number: 1, start_time: '09:00', end_time: '09:45', room: '101' },
    { id: 'tt-002', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-mat', teacher_id: 'tch-primary-002', day_of_week: 1, period_number: 2, start_time: '09:45', end_time: '10:30', room: '101' },
    { id: 'tt-003', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-sci', teacher_id: 'tch-primary-003', day_of_week: 1, period_number: 3, start_time: '10:45', end_time: '11:30', room: '101' },
    { id: 'tt-004', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-soc', teacher_id: 'tch-primary-001', day_of_week: 1, period_number: 4, start_time: '11:30', end_time: '12:15', room: '101' },
    { id: 'tt-005', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-cs', teacher_id: 'tch-primary-003', day_of_week: 1, period_number: 5, start_time: '13:00', end_time: '13:45', room: 'Computer Lab' },
    { id: 'tt-006', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-tam', teacher_id: 'tch-primary-004', day_of_week: 1, period_number: 6, start_time: '13:45', end_time: '14:30', room: '101' },

    // Tuesday
    { id: 'tt-007', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-mat', teacher_id: 'tch-primary-002', day_of_week: 2, period_number: 1, start_time: '09:00', end_time: '09:45', room: '101' },
    { id: 'tt-008', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-eng', teacher_id: 'tch-primary-001', day_of_week: 2, period_number: 2, start_time: '09:45', end_time: '10:30', room: '101' },
    { id: 'tt-009', school_id: 'SCH001', class_id: 'CLS001', section_id: 'SEC-1A', subject_id: 'sub-sci', teacher_id: 'tch-primary-003', day_of_week: 2, period_number: 3, start_time: '10:45', end_time: '11:30', room: '101' },
  ];

  // 16. Fee Structures & Student Fees
  fee_structures: FeeStructure[] = [
    { id: 'fee-str-001', school_id: 'SCH001', class_id: 'CLS001', title: 'Term 1 Tuition & Academic Fee', amount: 15000, due_date: '2026-10-31', academic_year: '2025-2026' },
    { id: 'fee-str-002', school_id: 'SCH001', class_id: 'CLS001', title: 'Computer Lab & Activity Fee', amount: 3500, due_date: '2026-11-15', academic_year: '2025-2026' },
    { id: 'fee-str-003', school_id: 'SCH001', class_id: 'CLS002', title: 'Term 1 Tuition Fee (Grade 2)', amount: 16000, due_date: '2026-10-31', academic_year: '2025-2026' },
  ];

  student_fees: StudentFeeRecord[] = [
    // Aarav Kumar (1-A)
    { id: 'sf-001', school_id: 'SCH001', student_id: 'stu-primary-001', fee_structure_id: 'fee-str-001', total_amount: 15000, paid_amount: 15000, status: 'paid', due_date: '2026-10-31', last_payment_date: '2026-09-28T10:00:00Z' },
    { id: 'sf-002', school_id: 'SCH001', student_id: 'stu-primary-001', fee_structure_id: 'fee-str-002', total_amount: 3500, paid_amount: 0, status: 'pending', due_date: '2026-11-15' },

    // Ananya Sharma (2-A)
    { id: 'sf-003', school_id: 'SCH001', student_id: 'stu-primary-004', fee_structure_id: 'fee-str-003', total_amount: 16000, paid_amount: 8000, status: 'partial', due_date: '2026-10-31', last_payment_date: '2026-10-02T11:30:00Z' },
  ];

  fee_payments: FeePayment[] = [
    { id: 'pay-001', student_fee_id: 'sf-001', student_id: 'stu-primary-001', amount: 15000, payment_method: 'Online UPI', transaction_ref: 'UPI-9382103819', receipt_number: 'REC-2025-001', paid_at: '2026-09-28T10:00:00Z' },
    { id: 'pay-002', student_fee_id: 'sf-003', student_id: 'stu-primary-004', amount: 8000, payment_method: 'NetBanking', transaction_ref: 'NB-481920381', receipt_number: 'REC-2025-002', paid_at: '2026-10-02T11:30:00Z' },
  ];

  // 17. Notifications
  notifications: SchoolNotification[] = [
    {
      id: 'notif-001',
      school_id: 'SCH001',
      user_id: 'par-primary-001',
      title: 'New Homework Assigned: Mathematics',
      message: 'Ravi Varma posted homework: Addition of Single Digit Numbers Practice for Section 1-A. Due on 19th Oct.',
      type: 'homework',
      target_url: '/parent/homework',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif-002',
      school_id: 'SCH001',
      user_id: 'par-primary-001',
      title: 'Mid-Term Exam Schedule Published',
      message: 'The examination timetable for Mid-Term Assessment 2025 is now live. Check the dates for your child.',
      type: 'exam',
      target_url: '/parent/timetable',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'notif-003',
      school_id: 'SCH001',
      user_id: 'tch-primary-001',
      title: 'Section 1-A Attendance Summary',
      message: 'All 2 students in Section 1-A marked present today.',
      type: 'attendance',
      target_url: '/teacher/attendance',
      is_read: true,
      created_at: new Date().toISOString(),
    },
  ];

  // 18. Parent-Teacher Messages (Strictly scoped)
  messages: ParentTeacherMessage[] = [
    {
      id: 'msg-001',
      school_id: 'SCH001',
      sender_id: 'par-primary-001',
      receiver_id: 'tch-primary-001',
      student_id: 'stu-primary-001',
      subject_id: 'sub-eng',
      message: 'Hello Ms. Priya, Aarav has completed the Nouns worksheet. Could you please review his pronunciation in the next session?',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'msg-002',
      school_id: 'SCH001',
      sender_id: 'tch-primary-001',
      receiver_id: 'par-primary-001',
      student_id: 'stu-primary-001',
      subject_id: 'sub-eng',
      message: 'Dear Mr. Rajesh, Aarav did wonderfully! I evaluated his submission with 9/10. We will practice phonics in tomorrow class.',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  // 19. Audit Logs
  audit_logs: AuditLogEntry[] = [
    { id: 'aud-001', school_id: 'SCH001', actor_id: 'admin-primary-001', action: 'CREATE', entity_type: 'section', entity_id: 'SEC-1A', details: { name: '1-A', class_id: 'CLS001' }, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'aud-002', school_id: 'SCH001', actor_id: 'admin-primary-001', action: 'ASSIGN_MENTOR', entity_type: 'section_mentors', entity_id: 'men-001', details: { section: '1-A', teacher: 'Priya Sharma' }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'aud-003', school_id: 'SCH001', actor_id: 'tch-primary-001', action: 'ENTER_MARKS', entity_type: 'marks', entity_id: 'mrk-001', details: { student: 'Aarav Kumar', marks: 44, subject: 'English' }, created_at: new Date().toISOString() },
  ];

  // Existing curriculum books, chapters, lessons, questions & tests
  books: Book[] = [
    {
      id: 'book-class1-primary-001',
      class_id: 'CLS001',
      subject_id: 'sub-eng',
      title: 'Class 1 English Reader (Term 1) - 2025 Edition',
      description: 'Tamil Nadu State Board Class 1 English Reader (Term 1) - Official Curriculum Textbook',
      file_url: '/uploads/book-1791934442231-618124287.pdf',
      file_name: 'Class_1_English_English_English_-_Term_1_-_2025_Edition-www.tntextbooks.in.pdf',
      page_count: 68,
      processing_status: 'book_ready',
      uploaded_by: 'TCH1001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  book_pages: BookPage[] = [];
  chapters: Chapter[] = [];
  lessons: Lesson[] = [
    {
      id: 'les-cls1-001',
      book_id: 'book-class1-primary-001',
      title: 'Lesson 1: In the Kitchen & Naming Words',
      content: 'In the kitchen, we see plates, spoons, cups, and fruits. Naming words tell us what people, animals, and things are called.',
      summary: 'Introduction to everyday kitchen nouns and pronunciation.',
      grammar_topics: ['Nouns', 'Naming Words', 'Singular Plural'],
      vocabulary: ['spoon', 'plate', 'kitchen', 'cup', 'fruit'],
      difficulty: 'Easy',
      created_at: new Date().toISOString(),
    },
  ];
  grammar_topics: GrammarTopic[] = [];
  questions: Question[] = [
    {
      id: 'gen-q-1791938367292-1',
      class_id: 'CLS001',
      topic: 'Nouns',
      question_text: 'Which of the following is a naming word (Noun)?',
      question_type: 'MCQ',
      options: ['Puppy', 'Quickly', 'Sing', 'Bright'],
      correct_answer: 'Puppy',
      explanation: 'Puppy is the name of an animal, which makes it a noun.',
      difficulty: 'Easy',
      status: 'approved',
      source_page: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'gen-q-1791938367292-2',
      class_id: 'CLS001',
      topic: 'Nouns',
      question_text: "Identify the noun in the sentence: 'The student reads a book in the library.'",
      question_type: 'MCQ',
      options: ['Library', 'Reads', 'In', 'The'],
      correct_answer: 'Library',
      explanation: 'Library is the name of a place, which makes it a noun.',
      difficulty: 'Easy',
      status: 'approved',
      source_page: 1,
      created_at: new Date().toISOString(),
    },
  ];
  tests: Test[] = [
    {
      id: 'test-1791938446268',
      class_id: 'CLS001',
      title: 'Unit 01',
      description: 'Noun Test',
      duration_minutes: 15,
      total_questions: 5,
      published: true,
      created_by: 'teacher',
      question_ids: ['gen-q-1791938367292-1', 'gen-q-1791938367292-2'],
      created_at: new Date().toISOString(),
    },
  ];
  student_attempts: StudentAttempt[] = [
    {
      id: 'attempt-1791939468639',
      student_id: 'stu-primary-001',
      test_id: 'test-1791938446268',
      score: 1,
      percentage: 20,
      time_taken: 115,
      started_at: new Date(Date.now() - 600000).toISOString(),
      completed_at: new Date().toISOString(),
      answers: [
        {
          question_id: 'gen-q-1791938367292-1',
          question: "Identify the noun in the sentence: 'The puppy plays in the garden.'",
          options: ['Puppy', 'Plays', 'In', 'The'],
          correct_answer: 'Puppy',
          explanation: 'Puppy is a noun naming an animal.',
          answer: 'Puppy',
          is_correct: true,
          marks: 1,
          feedback: 'Correct identification of the noun.',
          topic: 'Nouns',
        },
      ],
    },
  ];
  student_progress: StudentProgress[] = [
    {
      id: 'prog-001',
      student_id: 'stu-primary-001',
      class_id: 'CLS001',
      lesson_id: 'les-cls1-001',
      completion_percentage: 25,
      last_score: 20,
      updated_at: new Date().toISOString(),
    },
  ];
  weak_topics: WeakTopic[] = [
    {
      id: 'wt-001',
      student_id: 'stu-primary-001',
      topic: 'Nouns',
      accuracy: 20,
      recommended_action: 'Targeted practice exercises available for Nouns.',
      updated_at: new Date().toISOString(),
    },
  ];
  // NOVA AI Architecture State Arrays
  study_sessions: StudySession[] = [
    {
      id: 'sess-001',
      student_id: 'stu-primary-001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-sci',
      topic: 'Photosynthesis & Plant Life',
      activity_type: 'teach_back',
      started_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      duration_seconds: 1800,
      active_seconds: 1650,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'sess-002',
      student_id: 'stu-primary-001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-mat',
      topic: 'Fractions & Division',
      activity_type: 'practice',
      started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 23.3).toISOString(),
      duration_seconds: 2500,
      active_seconds: 2300,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'sess-003',
      student_id: 'stu-primary-001',
      school_id: 'SCH001',
      class_id: 'CLS001',
      section_id: 'SEC-1A',
      subject_id: 'sub-eng',
      topic: 'Parts of Speech & Nouns',
      activity_type: 'ai_interaction',
      started_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 47.5).toISOString(),
      duration_seconds: 1800,
      active_seconds: 1720,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  concept_mastery: ConceptMastery[] = [
    {
      id: 'cm-001',
      student_id: 'stu-primary-001',
      subject_id: 'sub-sci',
      topic: 'Photosynthesis & Plant Nutrition',
      recall_score: 94,
      understanding_score: 82,
      mastery_level: 'proficient',
      teach_backs_completed: 2,
      misconceptions_count: 0,
      last_evaluated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'cm-002',
      student_id: 'stu-primary-001',
      subject_id: 'sub-mat',
      topic: 'Fractions & Proportions',
      recall_score: 88,
      understanding_score: 64,
      mastery_level: 'developing',
      teach_backs_completed: 1,
      misconceptions_count: 1,
      last_evaluated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'cm-003',
      student_id: 'stu-primary-001',
      subject_id: 'sub-eng',
      topic: 'Nouns & Sentence Structure',
      recall_score: 96,
      understanding_score: 91,
      mastery_level: 'mastered',
      teach_backs_completed: 3,
      misconceptions_count: 0,
      last_evaluated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  teach_back_submissions: TeachBackSubmission[] = [
    {
      id: 'tb-001',
      student_id: 'stu-primary-001',
      subject_id: 'sub-sci',
      topic: 'Photosynthesis',
      student_explanation: 'Plants use green leaves with chlorophyll to catch sunlight, absorb water through roots, and take carbon dioxide to make glucose food and release oxygen.',
      input_mode: 'text',
      key_concepts_covered: ['Chlorophyll', 'Sunlight energy', 'Water and CO2 absorption', 'Glucose synthesis', 'Oxygen output'],
      recall_score: 94,
      understanding_score: 85,
      cause_effect_score: 88,
      reasoning_score: 82,
      in_own_words_score: 90,
      misconceptions_detected: [],
      missing_concepts: ['Stomata gas exchange regulation'],
      nova_feedback: 'Outstanding explanation Aarav! You clearly explained how sunlight, water, and air transform into plant food in your own words.',
      follow_up_questions: ['What would happen if a plant were kept in a completely dark room for one week?'],
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  learning_badges: LearningBadge[] = [
    {
      id: 'badge-001',
      student_id: 'stu-primary-001',
      badge_type: 'CONCEPT_MASTER',
      badge_name: 'Concept Master: Photosynthesis',
      description: 'Awarded for explaining plant energy transformation in own words with deep causal reasoning.',
      icon: 'Sparkles',
      criteria_met: [
        'Explained concept in own words',
        'Covered all core chemical inputs & outputs',
        'Answered Socratic follow-up scenario accurately',
        'Demonstrated >80% conceptual understanding',
      ],
      topic: 'Photosynthesis',
      subject_id: 'sub-sci',
      earned_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'badge-002',
      student_id: 'stu-primary-001',
      badge_type: 'GREAT_EXPLAINER',
      badge_name: 'Great Explainer',
      description: 'Successfully completed teach-back sessions articulating complex concepts clearly.',
      icon: 'Award',
      criteria_met: [
        'Completed 3 teach-back evaluations',
        'Maintained >85% in-own-words score',
        'Replaced memorized rote terms with natural explanations',
      ],
      earned_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: 'badge-003',
      student_id: 'stu-primary-001',
      badge_type: 'CURIOUS_MIND',
      badge_name: 'Curious Mind',
      description: 'Consistently asked thoughtful follow-up questions to deepen conceptual grasp.',
      icon: 'Lightbulb',
      criteria_met: [
        'Explored 10+ inquiry topics with NOVA',
        'Engaged with multi-subject curriculum books',
      ],
      earned_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    },
  ];

  nova_conversations: NovaConversation[] = [];

  test_integrity_events: TestIntegrityEvent[] = [
    {
      id: 'tie-001',
      student_id: 'stu-primary-001',
      test_id: 'test-primary-001',
      event_type: 'repeated_looking_away',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: { note: 'Camera signal detected gaze shift toward rough worksheet table' },
      reviewed_by_teacher: true,
      teacher_notes: 'Reviewed by Ravi Varma: Student was calculating mathematics steps on paper worksheet.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  activity_logs: ActivityLog[] = [];
  admin_credentials = {
    id_number: 'ADM1001',
    email: 'admin@englishiq.app',
    password: 'Admin@123',
    full_name: 'School Administrator',
  };

  // ================= HELPER & ACCESS CONTROL METHODS =================

  logActivity(type: ActivityLog['type'], message: string, meta?: any) {
    this.activity_logs.unshift({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      meta,
      timestamp: new Date().toISOString(),
    });
    if (this.activity_logs.length > 50) {
      this.activity_logs.pop();
    }
  }

  logAudit(action: string, entity_type: string, entity_id?: string, details?: any, actor_id?: string) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      school_id: 'SCH001',
      actor_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.audit_logs.unshift(entry);
    if (this.audit_logs.length > 200) {
      this.audit_logs.pop();
    }
    return entry;
  }

  notifyUser(user_id: string, title: string, message: string, type: SchoolNotification['type'], target_url?: string) {
    const notif: SchoolNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      school_id: 'SCH001',
      user_id,
      title,
      message,
      type,
      target_url,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  notifySection(section_id: string, title: string, message: string, type: SchoolNotification['type'], target_url?: string) {
    const sectionStudents = this.profiles.filter((p) => p.role === 'student' && p.section_id === section_id);
    const notificationsCreated: SchoolNotification[] = [];

    sectionStudents.forEach((student) => {
      // Notify student
      notificationsCreated.push(this.notifyUser(student.id, title, message, type, target_url));

      // Notify parent(s) of this student
      const parentMappings = this.parent_students.filter((ps) => ps.student_id === student.id);
      parentMappings.forEach((pm) => {
        notificationsCreated.push(this.notifyUser(pm.parent_id, `${title} - ${student.full_name}`, message, type, target_url));
      });
    });

    return notificationsCreated;
  }

  isSectionMentor(teacher_id: string, section_id: string): boolean {
    return this.section_mentors.some(
      (sm) => sm.teacher_id === teacher_id && sm.section_id === section_id
    );
  }

  // Strict Teacher Scope Authorization
  // Teacher can access ONLY if:
  // 1) Explicitly assigned to (section_id + subject_id)
  // 2) OR is the Section Mentor of the section (broader access to all subjects inside their section)
  canTeacherAccess(teacher_id: string, section_id: string, subject_id?: string): boolean {
    // Check if Section Mentor
    if (this.isSectionMentor(teacher_id, section_id)) return true;

    // If subject_id is specified, must have explicit assignment
    if (subject_id) {
      return this.teacher_assignments.some(
        (ta) =>
          ta.teacher_id === teacher_id &&
          ta.section_id === section_id &&
          ta.subject_id === subject_id &&
          ta.is_active
      );
    }

    // If no subject specified, teacher must have at least one active assignment in that section
    return this.teacher_assignments.some(
      (ta) => ta.teacher_id === teacher_id && ta.section_id === section_id && ta.is_active
    );
  }

  // Get all sections a teacher is authorized to access (assigned or mentor)
  getTeacherAuthorizedSections(teacher_id: string): { section_id: string; is_mentor: boolean; subjects: string[] }[] {
    const mentorSections = this.section_mentors
      .filter((sm) => sm.teacher_id === teacher_id)
      .map((sm) => sm.section_id);

    const assignments = this.teacher_assignments.filter((ta) => ta.teacher_id === teacher_id && ta.is_active);
    const sectionMap = new Map<string, { is_mentor: boolean; subjects: Set<string> }>();

    mentorSections.forEach((secId) => {
      sectionMap.set(secId, { is_mentor: true, subjects: new Set(this.subjects.map((s) => s.id)) });
    });

    assignments.forEach((ta) => {
      if (!sectionMap.has(ta.section_id)) {
        sectionMap.set(ta.section_id, { is_mentor: false, subjects: new Set() });
      }
      sectionMap.get(ta.section_id)!.subjects.add(ta.subject_id);
    });

    return Array.from(sectionMap.entries()).map(([secId, val]) => ({
      section_id: secId,
      is_mentor: val.is_mentor,
      subjects: Array.from(val.subjects),
    }));
  }

  // Get all children for a parent
  getParentChildren(parent_id: string): Profile[] {
    const mappings = this.parent_students.filter((ps) => ps.parent_id === parent_id);
    const studentIds = new Set(mappings.map((m) => m.student_id));
    return this.profiles.filter((p) => p.role === 'student' && studentIds.has(p.id));
  }

  isChildOfParent(parent_id: string, student_id: string): boolean {
    return this.parent_students.some(
      (ps) => ps.parent_id === parent_id && ps.student_id === student_id
    );
  }

  // ================= NOVA LEARNING & ANALYTICS METHODS =================
  getStudentLearningProfile(student_id: string) {
    const student = this.profiles.find((p) => p.id === student_id || p.id_number === student_id || p.user_id === student_id);
    const resolvedId = student?.id || student_id;
    const cls = student?.class_id ? this.classes.find((c) => c.id === student.class_id) : undefined;
    const sec = student?.section_id ? this.sections.find((s) => s.id === student.section_id) : undefined;

    // Study sessions
    const sessions = this.study_sessions.filter((s) => s.student_id === resolvedId);
    const totalStudySeconds = sessions.reduce((acc, curr) => acc + (curr.active_seconds || curr.duration_seconds || 0), 0);

    // Concept masteries
    const masteries = this.concept_mastery.filter((cm) => cm.student_id === resolvedId);
    const overallRecall = masteries.length > 0
      ? Math.round(masteries.reduce((acc, curr) => acc + curr.recall_score, 0) / masteries.length)
      : 88;
    const overallUnderstanding = masteries.length > 0
      ? Math.round(masteries.reduce((acc, curr) => acc + curr.understanding_score, 0) / masteries.length)
      : 76;

    // Subject profiles
    const subjectsProfile = this.subjects.map((sub) => {
      const subSessions = sessions.filter((s) => s.subject_id === sub.id);
      const subStudySeconds = subSessions.reduce((acc, curr) => acc + (curr.active_seconds || curr.duration_seconds || 0), 0);
      const subMasteries = masteries.filter((m) => m.subject_id === sub.id);

      const subRecall = subMasteries.length > 0
        ? Math.round(subMasteries.reduce((acc, curr) => acc + curr.recall_score, 0) / subMasteries.length)
        : Math.max(60, Math.min(95, overallRecall + (sub.id.charCodeAt(sub.id.length - 1) % 10) - 5));

      const subUnderstanding = subMasteries.length > 0
        ? Math.round(subMasteries.reduce((acc, curr) => acc + curr.understanding_score, 0) / subMasteries.length)
        : Math.max(50, Math.min(90, overallUnderstanding + (sub.id.charCodeAt(sub.id.length - 1) % 12) - 6));

      // Attempts & marks for this subject
      const subMarks = this.marks.filter((m) => m.student_id === resolvedId && m.subject_id === sub.id);
      const avgMark = subMarks.length > 0
        ? Math.round(subMarks.reduce((acc, curr) => acc + curr.percentage, 0) / subMarks.length)
        : Math.round((subRecall * 0.4) + (subUnderstanding * 0.6));

      const masteredTopics = subMasteries.filter((m) => m.understanding_score >= 80).map((m) => m.topic);
      const weakTopics = subMasteries.filter((m) => m.understanding_score < 70).map((m) => m.topic);

      // Add baseline weak topic if empty
      if (weakTopics.length === 0 && subMasteries.length === 0) {
        if (sub.name.toLowerCase().includes('math')) weakTopics.push('Fractions & Multi-digit Division');
        else if (sub.name.toLowerCase().includes('science')) weakTopics.push('Plant Cell Structure');
        else if (sub.name.toLowerCase().includes('english')) weakTopics.push('Compound Sentences');
      }

      let trend: 'improving' | 'steady' | 'needs_attention' = 'improving';
      if (subUnderstanding < 65) trend = 'needs_attention';
      else if (subUnderstanding < 78) trend = 'steady';

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        study_seconds: subStudySeconds || (sub.name === 'Science' ? 4200 : sub.name === 'Mathematics' ? 3600 : 2700),
        performance_score: avgMark,
        recall_score: subRecall,
        understanding_score: subUnderstanding,
        mastered_topics: masteredTopics.length > 0 ? masteredTopics : [`Basic ${sub.name} Foundations`],
        weak_topics: weakTopics,
        trend,
      };
    });

    // Student Badges
    const badges = this.learning_badges.filter((b) => b.student_id === resolvedId);

    // Personalized Recommendations based on real data
    const recommendations: Array<{ id: string; type: 'practice' | 'review' | 'teach_back'; topic: string; subject_name: string; text: string; estimated_minutes: number }> = [];

    subjectsProfile.forEach((sp, idx) => {
      if (sp.weak_topics.length > 0) {
        recommendations.push({
          id: `rec-${idx}-1`,
          type: 'teach_back',
          topic: sp.weak_topics[0],
          subject_name: sp.subject_name,
          text: `Try explaining ${sp.weak_topics[0]} to NOVA in your own words to bridge the gap between recall and conceptual understanding.`,
          estimated_minutes: 10,
        });
        recommendations.push({
          id: `rec-${idx}-2`,
          type: 'practice',
          topic: sp.weak_topics[0],
          subject_name: sp.subject_name,
          text: `Complete 5 targeted practice problems on ${sp.weak_topics[0]} to solidify core application skills.`,
          estimated_minutes: 15,
        });
      }
    });

    return {
      student_id: resolvedId,
      student_name: student?.full_name || 'Student',
      class_name: cls?.name || 'Class 1',
      section_name: sec?.full_name || '1-A',
      total_study_seconds: totalStudySeconds || 10500,
      overall_recall_average: overallRecall,
      overall_understanding_average: overallUnderstanding,
      subjects_profile: subjectsProfile,
      badges,
      recommendations: recommendations.slice(0, 4),
    };
  }

  awardBadge(
    student_id: string,
    badge_type: LearningBadge['badge_type'],
    badge_name: string,
    description: string,
    icon: string,
    criteria_met: string[],
    topic?: string,
    subject_id?: string
  ): LearningBadge | null {
    // Avoid duplicate badges of same type and topic
    const existing = this.learning_badges.find(
      (b) => b.student_id === student_id && b.badge_type === badge_type && b.topic === topic
    );
    if (existing) return existing;

    const newBadge: LearningBadge = {
      id: `badge-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      student_id,
      badge_type,
      badge_name,
      description,
      icon,
      criteria_met,
      topic,
      subject_id,
      earned_at: new Date().toISOString(),
    };

    this.learning_badges.unshift(newBadge);
    this.notifyUser(
      student_id,
      `🎉 New Learning Badge Unlocked: ${badge_name}`,
      `Congratulations! You earned the "${badge_name}" badge for outstanding conceptual learning.`,
      'announcement',
      '/student/achievements'
    );
    return newBadge;
  }

  recordStudyHeartbeat(session_id: string, active_seconds_delta: number) {
    const session = this.study_sessions.find((s) => s.id === session_id);
    if (session) {
      session.active_seconds = (session.active_seconds || 0) + active_seconds_delta;
      session.duration_seconds = Math.max(session.duration_seconds || 0, session.active_seconds);
      session.ended_at = new Date().toISOString();
    }
  }

  constructor() {
    this.syncFromSupabase();
  }

  // Real Database Source of Truth: sync data from Supabase
  async syncFromSupabase() {
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;

    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

      // 1. Sync classes
      const { data: dbClasses } = await supabase.from('classes').select('*');
      if (dbClasses && dbClasses.length > 0) {
        this.classes = dbClasses.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          description: c.description || `Grade ${c.grade} Curriculum`,
          student_count: 0,
          avg_score: 0,
          created_at: c.created_at || new Date().toISOString(),
        }));
      }

      // 2. Sync profiles
      const { data: dbProfiles } = await supabase.from('profiles').select('*');
      if (dbProfiles && dbProfiles.length > 0) {
        this.profiles = dbProfiles.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || 'User',
          email: p.email || '',
          role: (p.role === 'admin' ? 'admin' : p.role === 'teacher' ? 'teacher' : p.role === 'parent' ? 'parent' : 'student') as any,
          id_number: p.user_id || p.id_number || '',
          class_id: p.class_id || undefined,
          class_name: p.class_id ? this.classes.find((c) => c.id === p.class_id)?.name : undefined,
          section_id: p.section_id || undefined,
          section_name: p.section_id ? this.sections.find((s) => s.id === p.section_id)?.full_name : undefined,
          school_id: p.school_id || 'SCH001',
          phone: p.phone,
          batch: p.batch || (p.role === 'student' ? 'Batch 2025-2026' : undefined),
          gender: p.gender,
          dob: p.dob,
          parent_name: p.parent_name,
          parent_phone: p.parent_phone,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));

        // Update class student counts based on real profiles
        this.classes.forEach((c) => {
          c.student_count = this.profiles.filter((p) => p.role === 'student' && p.class_id === c.id).length;
        });
      }

      // 3. Sync sections
      const { data: dbSections } = await supabase.from('sections').select('*');
      if (dbSections && dbSections.length > 0) {
        this.sections = dbSections.map((s) => {
          const cls = this.classes.find((c) => c.id === s.class_id);
          return {
            id: s.id,
            school_id: s.school_id || 'SCH001',
            class_id: s.class_id,
            name: s.name,
            full_name: `${cls?.grade || ''}-${s.name}`,
            room_number: s.room_number,
            capacity: s.capacity,
            is_active: s.is_active ?? true,
            created_at: s.created_at || new Date().toISOString(),
          };
        });
      }
    } catch (err) {
      console.warn('DatabaseStore Supabase sync notice:', err);
    }
  }
}

export const db = new DatabaseStore();
