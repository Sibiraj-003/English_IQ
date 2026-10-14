# English_IQ

## EnglishIQ — AI-Powered School English Learning Portal

![EnglishIQ Academic Portal](public/logo.svg)

> **Subtitle**: AI-POWERED ENGLISH LEARNING PORTAL  
> **Theme**: Tactile Neo-Brutalist Academic Operating System  
> **Target Audience**: School Teachers & Primary/Secondary Students  

EnglishIQ is a full-stack educational web application designed for real school usage. It allows teachers to upload official English textbooks for specific classes, and uses an AI-powered RAG (Retrieval-Augmented Generation) pipeline to read, extract, and ground student learning, practice, testing, and teacher question generation strictly within each class's curriculum.

---

## ⚡ Key Highlights & Architecture

- **Strict Curriculum Isolation**: Student RAG queries are isolated by `class_id` and `book_id`. A Class 1 student will **never** retrieve content from Class 5 or another teacher's textbooks.
- **Neo-Brutalist Academic Aesthetics**:
  - Background: `#F8FAFC`, Primary Dark: `#0F172A`
  - Thick 2px solid dark borders & hard offset shadows (`3px 3px 0px #0F172A` / `5px 5px 0px #0F172A`)
  - Pastel accents: Lavender (`#C4B5FD`), Mint (`#A7F3D0`), Amber (`#FDE68A`), Sky (`#BAE6FD`), Soft Pink (`#FBCFE8`)
  - Mechanical tactile buttons with translate-depress interaction
  - Monospace system labels: `ACADEMIC_PORTAL`, `CLASS_01`, `GROQ_AI // ONLINE`, `BOOK_INDEXED`
- **Textbook Processing Pipeline**:
  - PDF Text Extraction with `pdf-parse`
  - Scanned Book OCR Fallback with Groq Multimodal Vision Model (`qwen/qwen3.8-27b`)
  - Automated structuring into Units, Lessons, Grammar Topics, Vocabulary, and Exercises
  - Chunking (500–1000 tokens) with metadata and normalized 384-dimensional semantic embeddings
- **Pedagogical AI Teacher**:
  - Age-appropriate language tailored to student grade level (Class 1 uses simple sentences, puppy/toy examples)
  - Source Transparency badge: `SOURCE: CLASS 1 ENGLISH // PAGE 18`
  - Interactive teaching modes: `[ EXPLAIN ]`, `[ PRACTICE ]`, `[ QUICK QUIZ ]`, `[ ASK AI ]`, `[ REVISION ]`
- **Teacher Assessment Studio**:
  - AI Question Generator produces candidates in `DRAFT` status with `AI_GENERATED // REVIEW_REQUIRED` badges
  - Teacher maintains final authority to Approve, Edit, or Reject before assembling tests
  - Test Builder compiles approved questions into timed student assessments
- **Automated Grading & Personalized Practice**:
  - Instant scoring, percentage, correct/wrong review, and topic accuracy breakdown
  - Weak Topic Detection (e.g. Pronouns < 65%) automatically generates targeted practice exercises
- **Interactive Dashboards & Gamification**:
  - Teacher analytics with Recharts visualizations, score distributions, and most difficult questions
  - Student learning streaks, lesson completion bars, and academic merit badges

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express, TypeScript, Multer, `pdf-parse`, `zod` |
| **AI / LLM** | Groq API (`qwen/qwen3.8-27b` text & multimodal vision) |
| **Vector DB / RAG** | PostgreSQL + pgvector (`match_text_chunks`), in-memory cosine store fallback |
| **Database** | Supabase PostgreSQL schema, migrations, and seed data |
| **Styling** | Custom Neo-Brutalist design tokens, Space Grotesk & JetBrains Mono typography |

---

## 📁 Project Structure

```
IS_School/
├── index.html                   # Entry HTML with Space Grotesk & JetBrains Mono
├── package.json                 # Unified scripts and dependencies
├── postcss.config.js
├── tailwind.config.js           # Neo-brutalist theme colors and brutal shadows
├── tsconfig.json
├── vite.config.ts               # Proxies /api and /uploads to port 5000
├── .env                         # Environment variables (Groq credentials)
├── .env.example                 # Sanitized template
├── public/
│   └── logo.svg                 # Original EnglishIQ logo
├── server/                      # Express Backend
│   ├── index.ts                 # Express server bootstrap (Port 5000)
│   ├── config/                  # Environment config
│   ├── ai/
│   │   ├── groqClient.ts        # Centralized Groq API client with vision support
│   │   ├── aiTeacher.ts         # Textbook-grounded AI Tutor with strict isolation
│   │   ├── questionGenerator.ts # Structured Zod-validated test generator
│   │   ├── evaluator.ts         # Answer grader & weak topic analyzer
│   │   └── textbookProcessor.ts # PDF parser, OCR fallback, and structuring
│   ├── rag/
│   │   ├── embeddings.ts        # 384-dimensional semantic embedding generator
│   │   └── vectorStore.ts       # Cosine similarity search with class/book filters
│   ├── db/
│   │   └── store.ts             # Data store seeded with Class 1 WonderBook
│   └── routes/                  # Express API Endpoints
│       ├── authRoutes.ts        # /api/auth/login, /api/auth/register, /api/auth/me
│       ├── booksRoutes.ts       # /api/books (Upload PDF, status, inspect)
│       ├── lessonsRoutes.ts     # /api/lessons (Curriculum lessons)
│       ├── aiRoutes.ts          # /api/ai/chat, /api/ai/explain, /api/ai/practice
│       ├── questionsRoutes.ts   # /api/questions (Generate, review, approve)
│       ├── testsRoutes.ts       # /api/tests (Create, submit, auto-evaluate)
│       ├── classesRoutes.ts     # /api/classes (Class 1 to Class 10 management)
│       └── analyticsRoutes.ts   # /api/students/.../progress, /api/classes/.../analytics
├── src/                         # React Frontend
│   ├── main.tsx
│   ├── App.tsx                  # Client router (public, student, teacher)
│   ├── index.css                # Neo-brutalist tactile utility classes
│   ├── types/                   # TypeScript interfaces
│   ├── services/api.ts          # Centralized API client
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth provider with 1-click Demo switcher
│   ├── layouts/
│   │   └── DashboardLayout.tsx  # Wrapper with Sidebar, Header, and DemoBanner
│   ├── components/
│   │   ├── BrutalButton.tsx     # Tactile button component
│   │   ├── BrutalCard.tsx       # Neo-brutalist card component
│   │   ├── Badge.tsx            # Monospace status badge
│   │   ├── Header.tsx           # Academic portal top bar with Groq status
│   │   ├── Sidebar.tsx          # Teacher & Student tactile navigations
│   │   ├── DemoBanner.tsx       # Fast 1-click Teacher/Student switch banner
│   │   ├── SourceBadge.tsx      # Source transparency badge (Requirement 65)
│   │   ├── LoadingState.tsx     # Technical ASCII progress & stage checklist
│   │   └── EmptyState.tsx       # Standard empty states
│   └── pages/
│       ├── auth/                # Login, Register, ForgotPassword
│       ├── teacher/             # Dashboard, Classes, Upload, Inspect, Questions, Tests, Analytics
│       └── student/             # Dashboard, Lessons, Reading, AI Teacher, Practice, Tests, Results, Progress, Achievements
└── supabase/
    ├── migrations/              # Initial SQL schema with pgvector & RLS
    └── seed/                    # Seed curriculum data for Class 1 WonderBook
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ or v22+)
- npm (v9+)

### 1. Installation

```bash
cd IS_School
npm install
```

### 2. Environment Setup

Create `.env` based on `.env.example`:

```ini
GROQ_API_KEY=your_groq_api_key_here
GROQ_TEXT_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
PORT=5000
NODE_ENV=development
```

### 3. Launch Development Server

Run both the Express backend and Vite frontend concurrently:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🎯 Demo Mode Quick Access

The application includes working pre-seeded Class 1 demo data (`Class 1 English WonderBook`) and instant 1-click login buttons:

- **Demo Teacher**: `teacher@example.com` (Sarah Jenkins)
- **Demo Student**: `student@example.com` (Leo Martinez)
- **Fast Switcher**: Click `[ TEACHER ]` or `[ STUDENT ]` anytime in the top demo banner to toggle roles instantly!

---

## 🧪 Testing the Complete End-to-End Workflow

1. **Sign In**: Navigate to `http://localhost:5173/login` and click `[ TEACHER DEMO ]`.
2. **Inspect Classes**: Go to `/teacher/classes` to view Class 1 through Class 5 cards.
3. **Upload & Process Textbook**: Go to `/teacher/books/upload`, select Class 1, and upload a textbook PDF. Observe the real-time stage progress bar (`EXTRACTING_TEXT` -> `OCR_PROCESSING` -> `STRUCTURING_BOOK` -> `INDEXING` -> `BOOK_READY`).
4. **Inspect Extracted Book**: Open `/teacher/books/book-class1-wonder` to inspect extracted Units, Lessons, Grammar Topics, and Vocabulary words.
5. **Generate Questions**: Go to `/teacher/questions`, click `[ + AI QUESTION GENERATOR ]`, select 3 MCQs on "Pronouns", and generate. Review the `DRAFT` questions and click `[ APPROVE ]`.
6. **Switch to Student**: Click `[ STUDENT ]` in the top banner to switch to student Leo Martinez.
7. **Read Lesson**: Open `/student/lessons` -> click `Lesson 1: My Family`. Read the passage, vocabulary cards, and note the Source Badge.
8. **Ask AI Teacher**: Navigate to `/student/ai-teacher`. Type: `"What is a noun?"` or click a prompt pill. Notice the response uses Leo, mother, and puppy Bruno from Lesson 1 with a clickable source badge.
9. **Take Test**: Navigate to `/student/tests` -> click `[ START TEST ]`. Answer questions and click `[ SUBMIT TEST ]`.
10. **Automated Evaluation**: View the instant diagnostic score, percentage, correct/wrong review, and the identified weak topic (`Pronouns 55%`).
11. **Personalized Practice**: Click `[ PRACTICE WEAK TOPICS ]` to solve 5 targeted exercises with immediate explanations.
12. **Review Progress**: Check `/student/progress` to view your score trend graphs and `/student/achievements` for merit badges.

---

## 🗄️ Supabase & Database Setup

The database schema is located in `supabase/migrations/20261013000000_initial_schema.sql` and `supabase/seed/seed.sql`:

1. Enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Run the migration script in your Supabase SQL editor.
3. Set your Supabase keys in `.env` if connecting to a remote Supabase instance:
   ```ini
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
*(Note: If Supabase keys are not set, EnglishIQ's built-in local store and vector engine will seamlessly handle all operations.)*

---

## 🛡️ Security & Privacy

- `GROQ_API_KEY` and database credentials are strictly kept server-side and never exposed to the frontend bundle.
- Uploaded files are validated for MIME type (`application/pdf`) and size (< 25MB).
- Strict role checking prevents students from accessing teacher-only question generator, test builder, and class settings.

---

## 📄 License

MIT License. Built for school learning environments.
