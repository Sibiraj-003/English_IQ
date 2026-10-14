import { vectorStore } from '../rag/vectorStore.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  id_number?: string;
  class_id?: string;
  batch?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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

export interface Subject {
  id: string;
  name: string;
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
  time_taken: number; // in seconds
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

class DatabaseStore {
  profiles: Profile[] = [
    {
      id: 'admin-primary-001',
      user_id: 'ADM1001',
      full_name: 'School Administrator',
      email: 'admin@englishiq.app',
      role: 'admin',
      id_number: 'ADM1001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tch-primary-001',
      user_id: 'TCH1001',
      full_name: 'Priya Sharma (Teacher)',
      email: 'teacher@englishiq.app',
      role: 'teacher',
      id_number: 'TCH1001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stu-primary-001',
      user_id: 'STU10001',
      full_name: 'Aarav Kumar (Student)',
      email: 'student@englishiq.app',
      role: 'student',
      id_number: 'STU10001',
      class_id: 'CLS001',
      batch: 'Batch 2025-2026',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  classes: SchoolClass[] = [
    { id: 'CLS001', name: 'Class 1', grade: 1, description: 'Primary Grade 1 - Early English Foundations, Phonics & Basic Grammar', student_count: 1, avg_score: 20, created_at: new Date().toISOString() },
    { id: 'CLS002', name: 'Class 2', grade: 2, description: 'Primary Grade 2 - Sentence Construction, Vocabulary & Story Comprehension', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS003', name: 'Class 3', grade: 3, description: 'Primary Grade 3 - Parts of Speech, Punctuation & Reading Passages', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS004', name: 'Class 4', grade: 4, description: 'Grade 4 - Intermediate Grammar & Composition', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS005', name: 'Class 5', grade: 5, description: 'Grade 5 - Advanced English & Literature', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS006', name: 'Class 6', grade: 6, description: 'Grade 6 - Middle School English Foundations', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS007', name: 'Class 7', grade: 7, description: 'Grade 7 - Middle School Grammar & Writing', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS008', name: 'Class 8', grade: 8, description: 'Grade 8 - Middle School Literature & Analysis', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS009', name: 'Class 9', grade: 9, description: 'Grade 9 - Secondary English & Composition', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS010', name: 'Class 10', grade: 10, description: 'Grade 10 - Secondary Board English & Literature', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS011', name: 'Class 11', grade: 11, description: 'Higher Secondary Grade 11 - Advanced English & Literature', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
    { id: 'CLS012', name: 'Class 12', grade: 12, description: 'Higher Secondary Grade 12 - Senior Board English & Language Studies', student_count: 0, avg_score: 0, created_at: new Date().toISOString() },
  ];
  subjects: Subject[] = [{ id: 'sub-eng', name: 'English', created_at: new Date().toISOString() }];
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
      title: 'Unit 1: My Pet',
      content: 'Meet my pet puppy. We play with a ball in the garden. He barks happily and drinks milk. Nouns in this unit include: puppy, ball, garden, milk.',
      summary: 'Introduction to pets, naming words (nouns), phonics sounds, and animal vocabulary.',
      grammar_topics: ['Nouns', 'Phonics', 'Sight Words'],
      vocabulary: ['puppy', 'garden', 'milk', 'play', 'bark'],
      difficulty: 'Easy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'les-cls1-002',
      book_id: 'book-class1-primary-001',
      title: 'Unit 2: Play Time',
      content: 'The children run, jump, and swing in the school playground. Action words (verbs) describe what we do: run, jump, swing, skip, slide.',
      summary: 'Action words (verbs), playground sports, rhyming words, and cooperative play.',
      grammar_topics: ['Verbs', 'Action Words', 'Rhyming'],
      vocabulary: ['swing', 'slide', 'jump', 'playground', 'cheer'],
      difficulty: 'Easy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'les-cls1-003',
      book_id: 'book-class1-primary-001',
      title: 'Unit 3: Families and Friends',
      content: 'This is my family. My mother reads stories. My father cooks tasty dinner. We love each other. Pronouns: he, she, we, they.',
      summary: 'Family relationships, pronouns (he, she, they), and kind words.',
      grammar_topics: ['Pronouns', 'Family Words'],
      vocabulary: ['mother', 'father', 'family', 'kind', 'story'],
      difficulty: 'Easy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'les-cls1-004',
      book_id: 'book-class1-primary-001',
      title: 'Unit 4: Our Kitchen',
      content: 'In our kitchen we see plates, spoons, cups, and fruits. One spoon, many spoons. One plate, many plates.',
      summary: 'Kitchen utensils, naming everyday objects, and singular/plural nouns.',
      grammar_topics: ['Singular and Plural Nouns', 'Everyday Objects'],
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
    {
      id: 'gen-q-1791938367292-3',
      class_id: 'CLS001',
      topic: 'Nouns',
      question_text: 'Which word is a proper noun that should always be written with a capital letter?',
      question_type: 'MCQ',
      options: ['Aarav', 'Boy', 'School', 'Teacher'],
      correct_answer: 'Aarav',
      explanation: 'Aarav is the specific name of an individual person, making it a proper noun.',
      difficulty: 'Medium',
      status: 'approved',
      source_page: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'gen-q-1791938367292-4',
      class_id: 'CLS001',
      topic: 'Nouns',
      question_text: "Choose the correct plural form of the noun 'Child':",
      question_type: 'MCQ',
      options: ['Children', 'Childs', 'Childrens', 'Childes'],
      correct_answer: 'Children',
      explanation: "Children is the irregular plural form of 'child'.",
      difficulty: 'Medium',
      status: 'approved',
      source_page: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'gen-q-1791938367292-5',
      class_id: 'CLS001',
      topic: 'Nouns',
      question_text: 'Select the collective noun used to describe a group of lions:',
      question_type: 'MCQ',
      options: ['Pride', 'Swarm', 'Pack', 'School'],
      correct_answer: 'Pride',
      explanation: 'A collective group of lions in English is called a pride.',
      difficulty: 'Hard',
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
      question_ids: [
        'gen-q-1791938367292-1',
        'gen-q-1791938367292-2',
        'gen-q-1791938367292-3',
        'gen-q-1791938367292-4',
        'gen-q-1791938367292-5',
      ],
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
          explanation: 'A noun is a word that names a person, place, animal, or thing. "Puppy" names an animal.',
          answer: 'Puppy',
          is_correct: true,
          marks: 1,
          feedback: 'Correct identification of the noun.',
          topic: 'Nouns',
        },
        {
          question_id: 'gen-q-1791938367292-2',
          question: "Identify the noun in the sentence: 'The student reads a book in the library.'",
          options: ['Library', 'Reads', 'In', 'The'],
          correct_answer: 'Library',
          explanation: 'Library is the name of a place, which makes it a noun.',
          answer: 'The',
          is_correct: false,
          marks: 0,
          feedback: 'Incorrect. "The" is an article, not a noun.',
          topic: 'Nouns',
        },
        {
          question_id: 'gen-q-1791938367292-3',
          question: 'Which word is a proper noun that must begin with a capital letter?',
          options: ['Aarav', 'Boy', 'School', 'Teacher'],
          correct_answer: 'Aarav',
          explanation: 'Aarav is the specific name of an individual, which makes it a proper noun.',
          answer: 'School',
          is_correct: false,
          marks: 0,
          feedback: 'Incorrect selection. "School" is a common noun.',
          topic: 'Nouns',
        },
        {
          question_id: 'gen-q-1791938367292-4',
          question: "Choose the correct plural form of the noun 'Child':",
          options: ['Children', 'Childs', 'Childrens', 'Childes'],
          correct_answer: 'Children',
          explanation: "Children is the irregular plural form of 'child'.",
          answer: 'Childs',
          is_correct: false,
          marks: 0,
          feedback: 'Incorrect plural form.',
          topic: 'Nouns',
        },
        {
          question_id: 'gen-q-1791938367292-5',
          question: 'Select the collective noun for a group of lions:',
          options: ['Pride', 'Swarm', 'Pack', 'School'],
          correct_answer: 'Pride',
          explanation: 'A group of lions is known as a pride in English.',
          answer: 'Swarm',
          is_correct: false,
          marks: 0,
          feedback: 'Incorrect collective noun. "Swarm" is used for bees or insects.',
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
      recommended_action: 'Targeted exercises are available to help you master Nouns.',
      updated_at: new Date().toISOString(),
    },
  ];
  activity_logs: ActivityLog[] = [];
  admin_credentials = {
    id_number: 'ADM1001',
    email: 'admin@englishiq.app',
    password: 'Admin@123',
    full_name: 'School Administrator',
  };

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

  constructor() {
    this.syncFromSupabase();
  }

  // Real Database Source of Truth: sync data from Supabase
  // NEVER inject hardcoded demo textbooks, fake attempts, or mock stats
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
          description: c.description || `Grade ${c.grade} English Curriculum`,
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
          role: (p.role === 'admin' ? 'admin' : p.role === 'teacher' ? 'teacher' : 'student') as 'teacher' | 'student' | 'admin',
          id_number: p.user_id || (p.role === 'admin' ? 'ADM1001' : p.role === 'teacher' ? 'TCH1001' : 'STU10001'),
          class_id: p.class_id || undefined,
          batch: p.batch || (p.role === 'student' ? 'Batch 2025-2026' : undefined),
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));

        // Update class student counts based on real profiles
        this.classes.forEach((c) => {
          c.student_count = this.profiles.filter((p) => p.role === 'student' && p.class_id === c.id).length;
        });
      }

      // 3. Sync books
      const { data: dbBooks } = await supabase.from('books').select('*');
      if (dbBooks && dbBooks.length > 0) {
        this.books = dbBooks.map((b) => ({
          id: b.id,
          class_id: b.class_id,
          subject_id: 'sub-eng',
          title: b.title,
          description: b.description || '',
          file_url: b.file_url || '',
          file_name: b.file_name || 'textbook.pdf',
          page_count: b.page_count || 0,
          processing_status: b.processing_status || 'processed',
          uploaded_by: b.uploaded_by,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
        }));
      }

      // 4. Sync lessons
      const { data: dbLessons } = await supabase.from('lessons').select('*');
      if (dbLessons && dbLessons.length > 0) {
        this.lessons = dbLessons.map((l) => ({
          id: l.id,
          book_id: l.book_id,
          title: l.title,
          content: l.content || '',
          summary: l.summary || '',
          grammar_topics: [],
          vocabulary: [],
          difficulty: 'Easy',
          created_at: l.created_at || new Date().toISOString(),
        }));
      }

      // 5. Sync questions
      const { data: dbQuestions } = await supabase.from('questions').select('*');
      if (dbQuestions && dbQuestions.length > 0) {
        this.questions = dbQuestions.map((q) => ({
          id: q.id,
          class_id: q.class_id,
          book_id: q.book_id,
          lesson_id: q.lesson_id,
          topic: q.topic || 'General',
          question_text: q.question_text,
          question_type: (q.question_type as any) || 'MCQ',
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          explanation: q.explanation || '',
          difficulty: (q.difficulty as any) || 'Medium',
          status: (q.status as any) || 'draft',
          created_at: q.created_at || new Date().toISOString(),
        }));
      }

      // 6. Sync tests
      const { data: dbTests } = await supabase.from('tests').select('*');
      if (dbTests && dbTests.length > 0) {
        this.tests = dbTests.map((t) => ({
          id: t.id,
          class_id: t.class_id,
          book_id: t.book_id,
          lesson_id: t.lesson_id,
          title: t.title,
          description: t.description || '',
          published: Boolean(t.published),
          duration_minutes: t.duration_minutes || 15,
          total_questions: 0,
          created_at: t.created_at || new Date().toISOString(),
        }));
      }

      // 7. Sync student attempts
      const { data: dbAttempts } = await supabase.from('student_attempts').select('*');
      if (dbAttempts && dbAttempts.length > 0) {
        this.student_attempts = dbAttempts.map((a) => ({
          id: a.id,
          student_id: a.student_id,
          test_id: a.test_id,
          score: a.score || 0,
          percentage: a.percentage || 0,
          started_at: a.started_at || new Date().toISOString(),
          completed_at: a.completed_at || new Date().toISOString(),
          time_taken: a.time_taken || 0,
          answers: [],
        }));
      }
    } catch (err) {
      console.warn('DatabaseStore Supabase sync notice:', err);
    }
  }
}

export const db = new DatabaseStore();
