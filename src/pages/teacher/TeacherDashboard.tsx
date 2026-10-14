import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api } from '../../services/api';
import { Book, SchoolClass, Test } from '../../types';
import {
  GraduationCap,
  BookOpen,
  Users,
  FileCheck,
  Plus,
  Upload,
  Layers,
  HelpCircle,
  FilePlus2,
  BarChart3,
  ArrowRight,
  Sparkles,
  Trash2,
  CheckCheck,
  CheckCircle2,
  Trophy,
  Medal,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [b, c, m, t] = await Promise.all([
          api.getBooks(),
          api.getClasses(),
          api.getRealtimeMetrics(),
          api.getTests(),
        ]);
        setBooks(b);
        setClasses(c);
        setMetrics(m);
        setTests(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const totalClasses = metrics?.curriculum?.total_classes ?? classes.length;
  const totalBooks = metrics?.curriculum?.total_books ?? books.length;
  const activeStudents = metrics?.curriculum?.total_students ?? 0;
  const publishedTests = metrics?.tests?.published_tests ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
              TEACHER_PORTAL // DASHBOARD
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              CURRICULUM_ACTIVE
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            Academic Operations Console
          </h2>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Manage textbooks, AI question generation, class curricula, and student analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <BrutalButton
            variant="mint"
            size="sm"
            onClick={() => navigate('/teacher/books/upload')}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            + UPLOAD TEXTBOOK
          </BrutalButton>
          <BrutalButton
            variant="lavender"
            size="sm"
            onClick={() => navigate('/teacher/classes')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            + CREATE CLASS
          </BrutalButton>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL CLASSES */}
        <BrutalCard size="normal" accent="lavender" className="p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
              TOTAL CLASSES
            </span>
            <GraduationCap className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {totalClasses}
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
            ACTIVE ENROLLED CLASSES
          </div>
        </BrutalCard>

        {/* TOTAL BOOKS */}
        <BrutalCard size="normal" accent="mint" className="p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
              TOTAL BOOKS
            </span>
            <BookOpen className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {totalBooks}
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
            UPLOADED TEXTBOOKS
          </div>
        </BrutalCard>

        {/* ACTIVE STUDENTS */}
        <BrutalCard size="normal" accent="amber" className="p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
              ACTIVE STUDENTS
            </span>
            <Users className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {activeStudents}
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
            ENROLLED IN SYSTEM
          </div>
        </BrutalCard>

        {/* PUBLISHED TESTS */}
        <BrutalCard size="normal" accent="sky" className="p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
              PUBLISHED TESTS
            </span>
            <FileCheck className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {publishedTests}
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
            AVAILABLE ASSESSMENTS
          </div>
        </BrutalCard>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <button
          onClick={() => navigate('/teacher/classes')}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <GraduationCap className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ CLASSES ]</span>
        </button>

        <button
          onClick={() => navigate('/teacher/books/upload')}
          className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <Upload className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ UPLOAD BOOK ]</span>
        </button>

        <button
          onClick={() => navigate('/teacher/lessons')}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <Layers className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ LESSONS ]</span>
        </button>

        <button
          onClick={() => navigate('/teacher/questions')}
          className="p-4 bg-[#F0FDF4] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <HelpCircle className="w-6 h-6 text-emerald-700" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ QUESTION BANK ]</span>
        </button>

        <button
          onClick={() => navigate('/teacher/tests')}
          className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <FilePlus2 className="w-6 h-6 text-[#0F172A]" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ TEST BUILDER ]</span>
        </button>

        <button
          onClick={() => navigate('/teacher/analytics')}
          className="p-4 bg-[#F5F3FF] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] text-left flex flex-col justify-between h-28"
        >
          <BarChart3 className="w-6 h-6 text-indigo-700" />
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">[ ANALYTICS ]</span>
        </button>
      </div>

      {/* Middle Section: Active Textbooks and Curriculum Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Textbook Inventory */}
        <BrutalCard size="large" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 font-mono">
            <div>
              <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                INDEXED_TEXTBOOKS // INVENTORY
              </span>
              <p className="text-[11px] text-slate-500">School textbooks uploaded to the curriculum database</p>
            </div>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => navigate('/teacher/books')}
            >
              VIEW ALL
            </BrutalButton>
          </div>

          <div className="space-y-3">
            {books.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] font-mono">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-extrabold text-[#0F172A] uppercase">NO TEXTBOOKS UPLOADED</div>
                <p className="text-xs text-slate-500 mt-1">Upload a textbook PDF to automatically extract lessons and generate questions.</p>
                <div className="mt-4">
                  <BrutalButton variant="mint" size="sm" onClick={() => navigate('/teacher/books/upload')}>
                    + UPLOAD TEXTBOOK
                  </BrutalButton>
                </div>
              </div>
            ) : (
              books.slice(0, 3).map((book) => {
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
                          {bookClass?.name || 'CLASS'}
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

        {/* AI Question Generation Callout */}
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
            onClick={() => navigate('/teacher/questions')}
            className="w-full"
            icon={<HelpCircle className="w-4 h-4" />}
          >
            OPEN QUESTION BANK
          </BrutalButton>
        </BrutalCard>
      </div>

      {/* Test Completion Status Section */}
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
              Student Test Completion Status
            </h3>
            <p className="text-xs text-slate-600">
              Real-time monitoring of student examination submissions across enrolled classes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <BrutalButton
              variant="mint"
              size="sm"
              onClick={() => navigate('/teacher/analytics')}
              icon={<BarChart3 className="w-3.5 h-3.5" />}
            >
              [ VIEW CLASS ANALYTICS ]
            </BrutalButton>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => navigate('/teacher/tests')}
              icon={<FilePlus2 className="w-3.5 h-3.5" />}
            >
              [ TEST BUILDER ]
            </BrutalButton>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] font-mono">
            <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-extrabold text-sm text-[#0F172A] uppercase">NO TESTS PUBLISHED YET</div>
            <p className="text-xs text-slate-500 mt-1">Publish a test in Test Builder to monitor student completions here.</p>
            <div className="mt-4">
              <BrutalButton variant="sky" size="sm" onClick={() => navigate('/teacher/tests')}>
                CREATE & PUBLISH TEST
              </BrutalButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => {
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
                        {testClass?.name || 'CLASS'}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#0F172A] font-sans">
                        {test.title}
                      </h4>

                      {/* Prominent completion badge */}
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
                      onClick={() => navigate('/teacher/analytics')}
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
