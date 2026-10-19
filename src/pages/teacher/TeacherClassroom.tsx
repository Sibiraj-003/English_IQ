import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Book, SchoolClass, Test, TeacherAssignment } from '../../types';
import {
  GraduationCap,
  BookOpen,
  Users,
  FileCheck,
  Upload,
  Layers,
  HelpCircle,
  FilePlus2,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
  CheckCheck,
  Trophy,
  ChevronDown,
  Clock,
  MessageSquare,
  ClipboardCheck,
  CalendarCheck2,
} from 'lucide-react';

export const TeacherClassroom: React.FC = () => {
  const { classId: paramClassId } = useParams<{ classId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Active selected class and subject
  const [selectedClassId, setSelectedClassId] = useState<string>(
    paramClassId || searchParams.get('class_id') || 'CLS001'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    searchParams.get('subject') || 'sub-eng'
  );
  const [selectedSectionName, setSelectedSectionName] = useState<string>(
    searchParams.get('section') || '1-A'
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [b, c, m, t, a] = await Promise.all([
          api.getBooks(),
          api.getClasses(),
          api.getRealtimeMetrics(),
          api.getTests(),
          api.getTeacherAssignments().catch(() => []),
        ]);
        setBooks(b);
        setClasses(c);
        setMetrics(m);
        setTests(t);
        setAssignments(a);
      } catch (err) {
        console.error('Error loading classroom data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Update URL search parameters when selection changes
  const handleClassSubjectChange = (val: string) => {
    const [cId, sId, sec] = val.split('|');
    setSelectedClassId(cId);
    setSelectedSubjectId(sId);
    if (sec) setSelectedSectionName(sec);
    setSearchParams({ class_id: cId, subject: sId, section: sec || '1-A' });
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setDeleting(true);
    try {
      await api.deleteBook(bookToDelete.id);
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  // Resolve current active class details
  const activeClass = classes.find((c) => c.id === selectedClassId) || {
    id: selectedClassId,
    name: selectedClassId === 'CLS002' ? 'Class 2' : 'Class 1',
    grade: selectedClassId === 'CLS002' ? 2 : 1,
  };

  // Filter books and tests for this class
  const classBooks = books.filter(
    (b) => !b.class_id || b.class_id === selectedClassId || selectedClassId === 'CLS001'
  );
  const classTests = tests.filter(
    (t) => !t.class_id || t.class_id === selectedClassId || selectedClassId === 'CLS001'
  );

  // Available teaching options for dropdown
  const teachingOptions = [
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-eng', subjectName: 'English' },
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-mat', subjectName: 'Mathematics' },
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-sci', subjectName: 'Science' },
    { classId: 'CLS001', className: 'Class 1', section: '1-B', subjectId: 'sub-eng', subjectName: 'English' },
    { classId: 'CLS002', className: 'Class 2', section: '2-A', subjectId: 'sub-mat', subjectName: 'Mathematics' },
  ];

  const currentOption =
    teachingOptions.find(
      (opt) => opt.classId === selectedClassId && opt.subjectId === selectedSubjectId
    ) || teachingOptions[0];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <BrutalButton
            variant="white"
            size="sm"
            onClick={() => navigate('/teacher/dashboard')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            &larr; BACK TO DASHBOARD
          </BrutalButton>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
              CLASSROOM_WORKSPACE
            </span>
            <span className="text-xs font-black text-[#0F172A] font-sans">
              {currentOption.className} (Section {currentOption.section}) &bull; {currentOption.subjectName}
            </span>
          </div>
        </div>

        {/* Quick Class & Subject Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-slate-600 uppercase shrink-0">
            SWITCH CLASS / SUBJECT:
          </span>
          <div className="relative">
            <select
              value={`${selectedClassId}|${selectedSubjectId}|${currentOption.section}`}
              onChange={(e) => handleClassSubjectChange(e.target.value)}
              className="appearance-none bg-[#FDE68A] text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] px-3 py-1.5 pr-8 text-xs font-black cursor-pointer hover:bg-[#FCD34D] focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
            >
              {teachingOptions.map((opt) => (
                <option
                  key={`${opt.classId}-${opt.section}-${opt.subjectId}`}
                  value={`${opt.classId}|${opt.subjectId}|${opt.section}`}
                >
                  {opt.className} ({opt.section}) &bull; {opt.subjectName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#0F172A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 1. Section Mentor & Scope Banner (from Image 3) */}
      <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] uppercase">
              SECTION_MENTOR // CLASS {currentOption.section}
            </span>
            <span className="text-[10px] font-bold text-slate-600">
              Full Section Academic Oversight
            </span>
          </div>
          <div className="text-xs font-bold text-[#0F172A]">
            Authorized Scope: {currentOption.className} (Section {currentOption.section}) &bull; Subjects: Mathematics, English, General Science
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2 py-1 bg-white border border-[#0F172A]">
            STATUS: STRICT_RLS_ENFORCED
          </span>
        </div>
      </div>

      {/* 2. Smart School Academic Operations Shortcuts (5 Buttons from Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
        <button
          onClick={() => navigate(`/teacher/attendance?class_id=${selectedClassId}&section=${currentOption.section}`)}
          className="p-3 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-24 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#0F172A] uppercase">ATTENDANCE</span>
            <span className="text-[9px] px-1 bg-white border border-[#0F172A] font-extrabold">DAILY</span>
          </div>
          <span className="text-[10px] font-bold text-slate-800">Mark student roll & alert parents &rarr;</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/homework?class_id=${selectedClassId}&subject=${selectedSubjectId}`)}
          className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-24 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#0F172A] uppercase">HOMEWORK</span>
            <span className="text-[9px] px-1 bg-white border border-[#0F172A] font-extrabold">TASKS</span>
          </div>
          <span className="text-[10px] font-bold text-slate-800">Assign & grade coursework &rarr;</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/marks?class_id=${selectedClassId}&subject=${selectedSubjectId}`)}
          className="p-3 bg-[#C4B5FD] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-24 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#0F172A] uppercase">EXAMS & MARKS</span>
            <span className="text-[9px] px-1 bg-white border border-[#0F172A] font-extrabold">AUTO_GRADE</span>
          </div>
          <span className="text-[10px] font-bold text-slate-800">Score entry & grade calculation &rarr;</span>
        </button>

        <button
          onClick={() => navigate('/teacher/messages')}
          className="p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-24 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#0F172A] uppercase">PARENT CHAT</span>
            <span className="text-[9px] px-1 bg-[#FDE68A] border border-[#0F172A] font-extrabold">SECURE</span>
          </div>
          <span className="text-[10px] font-bold text-slate-800">Direct guardian messaging &rarr;</span>
        </button>

        <button
          onClick={() => navigate('/teacher/timetable')}
          className="p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-24 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#0F172A] uppercase">MY TIMETABLE</span>
            <span className="text-[9px] px-1 bg-slate-100 border border-[#0F172A] font-extrabold">SLOTS</span>
          </div>
          <span className="text-[10px] font-bold text-slate-800">View weekly period schedule &rarr;</span>
        </button>
      </div>

      {/* 3. Quick Action Navigation Grid (6 Buttons from Image 3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <button
          onClick={() => navigate('/teacher/classes')}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <GraduationCap className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ CLASSES ]</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/books/upload?class_id=${selectedClassId}`)}
          className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <Upload className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ UPLOAD BOOK ]</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/lessons?class_id=${selectedClassId}`)}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <Layers className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ LESSONS ]</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/questions?class_id=${selectedClassId}`)}
          className="p-4 bg-[#F0FDF4] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <HelpCircle className="w-6 h-6 text-emerald-700" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ QUESTION BANK ]</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/tests?class_id=${selectedClassId}`)}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <FilePlus2 className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ TEST BUILDER ]</span>
        </button>

        <button
          onClick={() => navigate(`/teacher/analytics?class_id=${selectedClassId}`)}
          className="p-4 bg-[#F5F3FF] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28 cursor-pointer"
        >
          <BarChart3 className="w-6 h-6 text-indigo-700" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ ANALYTICS ]</span>
        </button>
      </div>

      {/* 4. Middle Section: Textbook Inventory & AI Question Generator (from Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Textbook Inventory */}
        <BrutalCard size="large" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 font-mono">
            <div>
              <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                INDEXED_TEXTBOOKS // INVENTORY
              </span>
              <p className="text-[11px] text-slate-500">
                Textbooks uploaded for {currentOption.className} ({currentOption.section}) &bull; {currentOption.subjectName}
              </p>
            </div>
            <div className="flex gap-2">
              <BrutalButton
                variant="white"
                size="sm"
                onClick={() => navigate('/teacher/books')}
              >
                VIEW ALL
              </BrutalButton>
              <BrutalButton
                variant="mint"
                size="sm"
                onClick={() => navigate(`/teacher/books/upload?class_id=${selectedClassId}`)}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                + UPLOAD BOOK
              </BrutalButton>
            </div>
          </div>

          <div className="space-y-3">
            {classBooks.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] font-mono">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-extrabold text-[#0F172A] uppercase">NO TEXTBOOKS FOR THIS CLASS</div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a textbook PDF to automatically extract curriculum units and generate AI questions.
                </p>
                <div className="mt-4">
                  <BrutalButton
                    variant="mint"
                    size="sm"
                    onClick={() => navigate(`/teacher/books/upload?class_id=${selectedClassId}`)}
                  >
                    + UPLOAD TEXTBOOK
                  </BrutalButton>
                </div>
              </div>
            ) : (
              classBooks.map((book) => {
                const bookClass = classes.find((c) => c.id === book.class_id);
                return (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/teacher/books/${book.id}`)}
                    className="p-4 border-2 border-[#0F172A] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer shadow-[2px_2px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white uppercase">
                          {bookClass?.name || currentOption.className}
                        </span>
                        <span className="text-xs font-extrabold text-[#0F172A]">
                          {book.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-sans line-clamp-1">
                        {book.description || book.file_name}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-bold">
                        <span>{book.page_count} PAGES</span>
                        <span>•</span>
                        <span className="uppercase">STATUS: {book.processing_status || 'READY'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={book.processing_status === 'processed' ? 'mint' : 'amber'}>
                        {book.processing_status === 'processed' ? 'BOOK_READY' : 'PROCESSING'}
                      </Badge>
                      <BrutalButton
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookToDelete(book);
                        }}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        title="Delete or remove this textbook"
                      >
                        REMOVE
                      </BrutalButton>
                      <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </BrutalCard>

        {/* AI Question Generation Callout (from Image 3) */}
        <BrutalCard size="large" accent="amber" className="p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0F172A] text-[#FDE68A] text-xs font-mono font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI QUESTION GENERATOR
            </div>
            <h3 className="text-lg font-extrabold text-[#0F172A] mb-2 font-sans">
              Generate Questions from Uploaded Textbook
            </h3>
            <p className="text-xs text-slate-700 font-medium mb-4">
              Generate curriculum-aligned MCQs, fill-in-the-blanks, and grammar challenges directly from uploaded textbooks. All questions require teacher review and approval before publishing.
            </p>
            <div className="p-3 bg-white border border-[#0F172A] mb-4 text-xs font-mono font-bold space-y-1">
              <div className="text-slate-600">
                Pending Review: <strong className="text-[#0F172A]">{metrics?.question_bank?.draft_questions ?? 0} Drafts</strong>
              </div>
              <div className="text-slate-600">
                Approved Bank: <strong className="text-emerald-700">{(metrics?.question_bank?.approved_questions ?? 0) + (metrics?.question_bank?.published_questions ?? 0)} Questions</strong>
              </div>
            </div>
          </div>

          <BrutalButton
            variant="primary"
            onClick={() => navigate(`/teacher/questions?class_id=${selectedClassId}`)}
            className="w-full"
            icon={<HelpCircle className="w-4 h-4" />}
          >
            OPEN QUESTION BANK
          </BrutalButton>
        </BrutalCard>
      </div>

      {/* 5. Student Test Completion Status Section (from Image 3) */}
      <BrutalCard size="large" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#0F172A] mb-4 font-mono">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#BAE6FD] text-[#0F172A] border border-[#0F172A]">
                CURRICULUM_ASSESSMENTS // COMPLETION_STATUS
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" />
                LIVE_SUBMISSION_TRACKING
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-[#0F172A] font-sans">
              Student Test Completion Status &bull; {currentOption.className}
            </h3>
            <p className="text-xs text-slate-600">
              Real-time monitoring of student examination submissions for {currentOption.className} ({currentOption.section}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <BrutalButton
              variant="mint"
              size="sm"
              onClick={() => navigate(`/teacher/analytics?class_id=${selectedClassId}`)}
              icon={<BarChart3 className="w-3.5 h-3.5" />}
            >
              [ VIEW CLASS ANALYTICS ]
            </BrutalButton>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => navigate(`/teacher/tests?class_id=${selectedClassId}`)}
              icon={<FilePlus2 className="w-3.5 h-3.5" />}
            >
              [ TEST BUILDER ]
            </BrutalButton>
          </div>
        </div>

        {classTests.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] font-mono">
            <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-extrabold text-sm text-[#0F172A] uppercase">NO TESTS PUBLISHED FOR THIS CLASS</div>
            <p className="text-xs text-slate-500 mt-1">Publish a test in Test Builder to monitor student completions here.</p>
            <div className="mt-4">
              <BrutalButton variant="sky" size="sm" onClick={() => navigate(`/teacher/tests?class_id=${selectedClassId}`)}>
                CREATE & PUBLISH TEST
              </BrutalButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {classTests.map((test) => {
              const testClass = classes.find((c) => c.id === test.class_id);
              const totalEnrolled = test.total_enrolled ?? (testClass?.students_count || 1);
              const submissionsCount = test.submissions_count ?? 0;
              const allCompleted = test.all_students_completed || (totalEnrolled > 0 && submissionsCount >= totalEnrolled);
              const completionPercent = test.completion_percentage ?? (totalEnrolled > 0 ? Math.min(100, Math.round((submissionsCount / totalEnrolled) * 100)) : 0);

              return (
                <div
                  key={test.id}
                  className={`p-4 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono ${
                    allCompleted ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white uppercase">
                        {testClass?.name || currentOption.className}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#0F172A] font-sans">
                        {test.title}
                      </h4>

                      {/* Completion badge */}
                      {allCompleted ? (
                        <span className="px-2.5 py-0.5 bg-emerald-200 border-2 border-emerald-900 text-emerald-950 text-xs font-extrabold flex items-center gap-1 shadow-[1.5px_1.5px_0px_#0F172A]">
                          <CheckCheck className="w-4 h-4 stroke-[3] text-emerald-800" />
                          ALL STUDENTS COMPLETED
                        </span>
                      ) : submissionsCount > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-900 text-amber-950 text-xs font-extrabold">
                          IN PROGRESS ({submissionsCount}/{totalEnrolled} COMPLETED)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 border border-slate-700 text-slate-800 text-xs font-bold">
                          PENDING ({submissionsCount}/{totalEnrolled} COMPLETED)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-bold">
                      <span>{test.total_questions || 5} QUESTIONS</span>
                      <span>•</span>
                      <span>{test.duration_minutes || 15} MIN DURATION</span>
                      <span>•</span>
                      <span className={allCompleted ? 'text-emerald-800 font-extrabold' : 'text-slate-700'}>
                        {submissionsCount} OF {totalEnrolled} ENROLLED STUDENTS COMPLETED ({completionPercent}%)
                      </span>
                      {test.average_score !== undefined && test.average_score > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-800 font-extrabold">
                            CLASS AVG: {test.average_score}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full sm:w-64 bg-slate-200 h-2 border border-[#0F172A] mt-1">
                      <div
                        className={`h-full transition-all duration-300 ${allCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>

                    {/* Student Merit / Ranking Summary */}
                    {test.top_ranked && test.top_ranked.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#0F172A]/20 space-y-1.5">
                        <div className="text-[11px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ranked Students & Scored Marks:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {test.top_ranked.map((st) => (
                            <div
                              key={st.attempt_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/results/${st.attempt_id}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-xs font-mono hover:bg-[#FEFCE8] cursor-pointer transition-colors"
                              title="Click to view full evaluated attempt"
                            >
                              <span className={`px-1 py-0.2 text-[10px] font-extrabold border border-[#0F172A] ${
                                st.rank === 1 ? 'bg-[#FEF08A] text-amber-950' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {st.rank === 1 ? '🥇 #1' : `#${st.rank}`}
                              </span>
                              <span className="font-sans font-extrabold text-[#0F172A]">
                                {st.student_name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">
                                ({st.student_id_number})
                              </span>
                              <span className="font-extrabold text-emerald-800">
                                {st.score}/{st.total_marks} ({st.percentage}%)
                              </span>
                              <span className="text-[10px] font-extrabold px-1 bg-[#C4B5FD] border border-[#0F172A]">
                                {st.grade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <BrutalButton
                      variant={allCompleted ? 'mint' : 'white'}
                      size="sm"
                      onClick={() => navigate(`/teacher/analytics?class_id=${selectedClassId}`)}
                      icon={<BarChart3 className="w-3.5 h-3.5" />}
                    >
                      {allCompleted ? '[ VIEW EVALUATED REPORT ]' : '[ VIEW CLASS ANALYTICS ]'}
                    </BrutalButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BrutalCard>

      {/* Book Deletion Modal */}
      <ConfirmModal
        isOpen={!!bookToDelete}
        title={`DELETE TEXTBOOK: ${bookToDelete?.title || ''}`}
        message={`Are you sure you want to remove "${bookToDelete?.title}"? Deleting this book will remove all derived lessons, generated questions, and AI vector embeddings.`}
        confirmText="DELETE BOOK"
        cancelText="CANCEL"
        loading={deleting}
        onConfirm={handleDeleteBook}
        onCancel={() => {
          if (!deleting) setBookToDelete(null);
        }}
      />
    </div>
  );
};
