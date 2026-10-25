import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Book, SchoolClass, Test, TeacherAssignment, TimetableSlot, MarkEntry } from '../../types';
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
  Bot,
  Award,
  Search,
  Printer,
  FileText,
  CheckCircle,
  Calendar,
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
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [examMarks, setExamMarks] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Tab state: subjects | timetable | marks | operations
  const [classroomTab, setClassroomTab] = useState<'subjects' | 'timetable' | 'marks' | 'operations'>(
    (searchParams.get('tab') as any) || 'subjects'
  );
  const [activeDay, setActiveDay] = useState<number>(1);
  const [studentSearch, setStudentSearch] = useState<string>('');

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
        const [b, c, m, t, a, tt, mk] = await Promise.all([
          api.getBooks(),
          api.getClasses(),
          api.getRealtimeMetrics(),
          api.getTests(),
          api.getTeacherAssignments().catch(() => []),
          api.getTimetable({ section_id: 'SEC-1A' }).catch(() => []),
          api.getExamMarks('exam-001', { section_id: 'SEC-1A' }).catch(() => []),
        ]);
        setBooks(b);
        setClasses(c);
        setMetrics(m);
        setTests(t);
        setAssignments(a);
        setTimetableSlots(tt);
        setExamMarks(mk);
      } catch (err) {
        console.error('Error loading classroom data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTabChange = (tab: 'subjects' | 'timetable' | 'marks' | 'operations') => {
    setClassroomTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'subjects' | 'timetable' | 'marks' | 'operations';
    if (tabParam && ['subjects', 'timetable', 'marks', 'operations'].includes(tabParam)) {
      setClassroomTab(tabParam);
    }
  }, [searchParams]);

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
    description: '',
    students_count: selectedClassId === 'CLS002' ? 2 : 4,
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

  // Active class student count specifically for this class
  const classActiveStudents =
    selectedClassId === 'CLS002'
      ? 2
      : selectedSectionName === '1-B'
      ? 3
      : ('students_count' in activeClass && activeClass.students_count) || (metrics?.curriculum?.total_students ?? 4);

  // Active class published tests specifically for this class & subject
  const classPublishedTests =
    classTests.filter((t) => t.published !== false).length || 1;

  // Full curriculum subjects studied by this class and their assigned staff
  const classFacultyList =
    currentOption.section === '1-A'
      ? [
          { subject: 'Tamil', code: 'TAM101', subjectId: 'sub-tam', teacher: 'K. Murugan', role: 'Tamil Faculty', room: 'Room 101', periodsPerWeek: 5, color: 'bg-emerald-400' },
          { subject: 'English', code: 'ENG101', subjectId: 'sub-eng', teacher: 'Priya Sharma (Class Teacher)', isMentor: true, role: 'Languages Dept (Section Mentor)', room: 'Room 101', periodsPerWeek: 6, color: 'bg-amber-300' },
          { subject: 'Mathematics', code: 'MAT101', subjectId: 'sub-mat', teacher: 'Ravi Varma', role: 'Mathematics Specialist', room: 'Room 101', periodsPerWeek: 6, color: 'bg-indigo-300' },
          { subject: 'Science', code: 'SCI101', subjectId: 'sub-sci', teacher: 'Suresh Raina', role: 'Science Dept', room: 'Science Lab', periodsPerWeek: 5, color: 'bg-cyan-300' },
          { subject: 'Social Science', code: 'SOC101', subjectId: 'sub-soc', teacher: 'Meenakshi Sundaram', role: 'Social Studies Dept', room: 'Room 101', periodsPerWeek: 4, color: 'bg-rose-300' },
          { subject: 'Computer Science', code: 'CSC101', subjectId: 'sub-cs', teacher: 'Arun Prakash', role: 'Technology & Computing', room: 'Computer Lab', periodsPerWeek: 4, color: 'bg-purple-300' },
        ]
      : currentOption.section === '1-B'
      ? [
          { subject: 'Tamil', code: 'TAM101', subjectId: 'sub-tam', teacher: 'K. Murugan', role: 'Tamil Faculty', room: 'Room 102', periodsPerWeek: 5, color: 'bg-emerald-400' },
          { subject: 'English', code: 'ENG101', subjectId: 'sub-eng', teacher: 'Anitha George', role: 'Languages Faculty', room: 'Room 102', periodsPerWeek: 6, color: 'bg-amber-300' },
          { subject: 'Mathematics', code: 'MAT101', subjectId: 'sub-mat', teacher: 'Ravi Varma', role: 'Mathematics Specialist', room: 'Room 102', periodsPerWeek: 6, color: 'bg-indigo-300' },
          { subject: 'Science', code: 'SCI101', subjectId: 'sub-sci', teacher: 'Suresh Raina', role: 'Science Dept', room: 'Science Lab', periodsPerWeek: 5, color: 'bg-cyan-300' },
          { subject: 'Social Science', code: 'SOC101', subjectId: 'sub-soc', teacher: 'Meenakshi Sundaram', role: 'Social Studies', room: 'Room 102', periodsPerWeek: 4, color: 'bg-rose-300' },
        ]
      : [
          { subject: 'Tamil', code: 'TAM201', subjectId: 'sub-tam', teacher: 'K. Murugan', role: 'Tamil Faculty', room: 'Room 201', periodsPerWeek: 5, color: 'bg-emerald-400' },
          { subject: 'English', code: 'ENG201', subjectId: 'sub-eng', teacher: 'Anitha George', role: 'Languages Faculty', room: 'Room 201', periodsPerWeek: 6, color: 'bg-amber-300' },
          { subject: 'Mathematics', code: 'MAT201', subjectId: 'sub-mat', teacher: 'Ravi Varma (Class Teacher)', isMentor: true, role: 'Math Specialist', room: 'Room 201', periodsPerWeek: 6, color: 'bg-indigo-300' },
          { subject: 'Science', code: 'SCI201', subjectId: 'sub-sci', teacher: 'Suresh Raina', role: 'Science Dept', room: 'Science Lab', periodsPerWeek: 5, color: 'bg-cyan-300' },
          { subject: 'Environmental Studies', code: 'EVS201', subjectId: 'sub-evs', teacher: 'Meenakshi Sundaram', role: 'Environmental Studies', room: 'Room 201', periodsPerWeek: 4, color: 'bg-rose-300' },
        ];

  // Complete student marks matrix for Section 1-A with all curriculum subjects
  const defaultClass1AStudents = [
    {
      id: 'stu-primary-002',
      name: 'Diya Lakshmi',
      roll: '10002',
      gender: 'Female',
      scores: {
        tam: 48,
        eng: 48,
        mat: 46,
        sci: 46,
        soc: 47,
        csc: 48,
      },
      total: 283,
      pct: 94.3,
      grade: 'A+',
      rank: 1,
      rankBadge: '🥇 #1 TOPPER',
      status: 'PASSED',
      attendance: '98%',
      teacherRemarks: 'Exemplary academic achievement across all languages and sciences.',
    },
    {
      id: 'stu-primary-001',
      name: 'Aarav Kumar',
      roll: '10001',
      gender: 'Male',
      scores: {
        tam: 45,
        eng: 44,
        mat: 47,
        sci: 42,
        soc: 45,
        csc: 48,
      },
      total: 271,
      pct: 90.3,
      grade: 'A+',
      rank: 2,
      rankBadge: '🥈 #2 RANK',
      status: 'PASSED',
      attendance: '96%',
      teacherRemarks: 'Outstanding mathematical reasoning and strong vocabulary.',
    },
    {
      id: 'stu-primary-005',
      name: 'Kavya Suresh',
      roll: '10005',
      gender: 'Female',
      scores: {
        tam: 46,
        eng: 42,
        mat: 41,
        sci: 44,
        soc: 41,
        csc: 44,
      },
      total: 258,
      pct: 86.0,
      grade: 'A',
      rank: 3,
      rankBadge: '🥉 #3 RANK',
      status: 'PASSED',
      attendance: '95%',
      teacherRemarks: 'Consistent performer with great handwriting and reading clarity.',
    },
    {
      id: 'stu-primary-006',
      name: 'Vikram Aditya',
      roll: '10006',
      gender: 'Male',
      scores: {
        tam: 41,
        eng: 39,
        mat: 44,
        sci: 39,
        soc: 40,
        csc: 44,
      },
      total: 247,
      pct: 82.3,
      grade: 'A',
      rank: 4,
      rankBadge: '#4 RANK',
      status: 'PASSED',
      attendance: '93%',
      teacherRemarks: 'Great mental math; encouraged to practice English spelling daily.',
    },
  ];

  const filteredStudents = defaultClass1AStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.roll.includes(studentSearch)
  );

  const weekDays = [
    { num: 1, label: 'MONDAY', date: 'DAY 1' },
    { num: 2, label: 'TUESDAY', date: 'DAY 2' },
    { num: 3, label: 'WEDNESDAY', date: 'DAY 3' },
    { num: 4, label: 'THURSDAY', date: 'DAY 4' },
    { num: 5, label: 'FRIDAY', date: 'DAY 5' },
  ];

  const currentDaySlots =
    timetableSlots.filter((t) => Number(t.day_of_week) === activeDay).length > 0
      ? timetableSlots
          .filter((t) => Number(t.day_of_week) === activeDay)
          .sort((a, b) => (a.period_number || 0) - (b.period_number || 0))
      : [
          { period_number: 1, start_time: '09:00', end_time: '09:45', subject_name: 'English', teacher_name: 'Priya Sharma (Class Teacher)', room: 'Room 101' },
          { period_number: 2, start_time: '09:45', end_time: '10:30', subject_name: 'Mathematics', teacher_name: 'Ravi Varma', room: 'Room 101' },
          { period_number: 3, start_time: '10:45', end_time: '11:30', subject_name: 'Science', teacher_name: 'Suresh Raina', room: 'Science Lab' },
          { period_number: 4, start_time: '11:30', end_time: '12:15', subject_name: 'Social Science', teacher_name: 'Meenakshi Sundaram', room: 'Room 101' },
          { period_number: 5, start_time: '13:00', end_time: '13:45', subject_name: 'Computer Science', teacher_name: 'Arun Prakash', room: 'Computer Lab' },
          { period_number: 6, start_time: '13:45', end_time: '14:30', subject_name: 'Tamil', teacher_name: 'K. Murugan', room: 'Room 101' },
        ];

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

          <BrutalButton
            variant="amber"
            size="sm"
            onClick={() => navigate('/teacher/ai-assistant')}
            icon={<Bot className="w-4 h-4" />}
          >
            AI COPILOT
          </BrutalButton>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] uppercase">
              CLASS_WORKSPACE
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
      <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
              Authorized Scope: {currentOption.className} (Section {currentOption.section}) &bull; Active Curriculum Oversight
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-1 bg-white border border-[#0F172A]">
              STATUS: STRICT_RLS_ENFORCED
            </span>
          </div>
        </div>

        {/* Subjects studied by students with teaching faculty */}
        <div className="pt-2 border-t border-[#0F172A]/15">
          <div className="text-[10px] font-extrabold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
            <span>CURRICULUM SUBJECTS STUDIED BY STUDENTS &amp; ASSIGNED TEACHING FACULTY:</span>
            <span className="text-[9px] bg-white border border-[#0F172A] px-1.5 py-0.2 font-black">
              {classFacultyList.length} SUBJECTS
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {classFacultyList.map((item) => (
              <div
                key={item.subject}
                className="px-2.5 py-1 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center gap-1.5"
              >
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="font-extrabold text-[#0F172A]">{item.subject}:</span>
                <span className="font-bold text-slate-700">{item.teacher}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Class Navigation View Switcher */}
      <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTabChange('subjects')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-[#0F172A] transition-all flex items-center gap-1.5 cursor-pointer ${
              classroomTab === 'subjects'
                ? 'bg-[#FEF08A] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            [ 📚 CURRICULUM SUBJECTS &amp; STAFF ]
          </button>

          <button
            onClick={() => handleTabChange('timetable')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-[#0F172A] transition-all flex items-center gap-1.5 cursor-pointer ${
              classroomTab === 'timetable'
                ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            [ 🕒 CLASS TIMETABLE SCHEDULE ]
          </button>

          <button
            onClick={() => handleTabChange('marks')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-[#0F172A] transition-all flex items-center gap-1.5 cursor-pointer ${
              classroomTab === 'marks'
                ? 'bg-[#C4B5FD] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            [ 📊 STUDENT SUBJECT MARKS SHEET ]
          </button>

          <button
            onClick={() => handleTabChange('operations')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-[#0F172A] transition-all flex items-center gap-1.5 cursor-pointer ${
              classroomTab === 'operations'
                ? 'bg-[#93C5FD] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            [ 🧭 WORKSPACE &amp; OPERATIONS ]
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-black px-2 py-0.5 bg-[#FEFCE8] border border-[#0F172A] text-slate-800">
            CLASS: {currentOption.className} ({currentOption.section})
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-emerald-950">
            ACTIVE VIEW: {classroomTab.toUpperCase()}
          </span>
        </div>
      </div>

      {/* VIEW: CURRICULUM SUBJECTS & ASSIGNED TEACHING FACULTY */}
      {classroomTab === 'subjects' && (
        <div className="space-y-4 font-mono">
          <div className="p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#FEF08A] text-[#0F172A] border border-[#0F172A] uppercase">
                  SECTION_MENTOR // SUBJECT DIRECTORY
                </span>
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  100% FACULTY STAFFED
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
                Curriculum Subjects Studied by Students &bull; {currentOption.className} (Section {currentOption.section})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Full academic directory of subjects studied by Section {currentOption.section} students with their assigned teaching faculty and weekly periods.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BrutalButton
                variant="mint"
                size="sm"
                onClick={() => handleTabChange('timetable')}
                icon={<Clock className="w-3.5 h-3.5" />}
              >
                VIEW TIMETABLE &rarr;
              </BrutalButton>
              <BrutalButton
                variant="lavender"
                size="sm"
                onClick={() => handleTabChange('marks')}
                icon={<Award className="w-3.5 h-3.5" />}
              >
                VIEW MARKSHEET &rarr;
              </BrutalButton>
            </div>
          </div>

          {/* Grid of 6 Curriculum Subjects with Assigned Faculty */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classFacultyList.map((item, idx) => {
              const isClassTeacher = item.isMentor || item.subject.toLowerCase() === 'english';
              return (
                <BrutalCard
                  key={idx}
                  size="normal"
                  accent={isClassTeacher ? 'amber' : idx % 2 === 0 ? 'mint' : 'lavender'}
                  className="p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-white border-2 border-[#0F172A] text-[11px] font-black uppercase shadow-[1.5px_1.5px_0px_#0F172A]">
                        {item.code || `SUB10${idx + 1}`}
                      </span>
                      {isClassTeacher ? (
                        <span className="px-1.5 py-0.5 bg-[#FEF08A] border border-[#0F172A] text-[9px] font-black uppercase text-[#0F172A]">
                          ⭐ SECTION MENTOR
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {item.role || 'Subject Faculty'}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-sm border border-[#0F172A] ${item.color || 'bg-amber-300'}`} />
                        <h4 className="text-lg font-extrabold text-[#0F172A] font-sans">
                          {item.subject}
                        </h4>
                      </div>

                      <div className="mt-3 p-2.5 bg-white/80 border border-[#0F172A] space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Assigned Faculty:</span>
                          <span className="font-extrabold text-[#0F172A] font-sans">{item.teacher}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Weekly Routine:</span>
                          <span className="font-black text-[#0F172A]">{item.periodsPerWeek || 5} Periods / Week</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Classroom / Lab:</span>
                          <span className="font-black text-slate-800">{item.room || 'Room 101'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-[#0F172A]">
                    <button
                      onClick={() => {
                        if (item.subjectId) {
                          handleClassSubjectChange(`${selectedClassId}|${item.subjectId}|${currentOption.section}`);
                        }
                        handleTabChange('operations');
                      }}
                      className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-mono text-xs font-black flex items-center justify-center gap-1.5 border border-[#0F172A] shadow-[2px_2px_0px_#0F172A] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-all"
                    >
                      <span>ENTER {item.subject.toUpperCase()} WORKSPACE</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FDE68A]" />
                    </button>
                  </div>
                </BrutalCard>
              );
            })}
          </div>

          {/* Quick Academic Supervision Summary Footnote */}
          <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0F172A] shrink-0" />
              <div>
                <span className="font-black text-[#0F172A]">SECTION ACADEMIC SUPERVISION:</span>
                <span className="text-slate-700 ml-1">
                  6 Curriculum Subjects &bull; 30 Total Weekly Periods &bull; 4 Enrolled Students &bull; Conflict-Free Verified
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleTabChange('timetable')}
                className="px-2.5 py-1 bg-white hover:bg-[#A7F3D0] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[10px] font-black cursor-pointer"
              >
                OPEN TIMETABLE &rarr;
              </button>
              <button
                onClick={() => handleTabChange('marks')}
                className="px-2.5 py-1 bg-white hover:bg-[#C4B5FD] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[10px] font-black cursor-pointer"
              >
                OPEN MARKS SHEET &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CLASS TIMETABLE SCHEDULE */}
      {classroomTab === 'timetable' && (
        <div className="space-y-4 font-mono">
          <div className="p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] uppercase">
                  SECTION TIMETABLE ENGINE
                </span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  CONFLICT-FREE VERIFIED
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
                Weekly Class Routine &bull; {currentOption.className} (Section {currentOption.section})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Full weekly period schedule with start times, assigned subject specialists, and designated classrooms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <BrutalButton
                variant="white"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                PRINT TIMETABLE
              </BrutalButton>
              <BrutalButton
                variant="mint"
                size="sm"
                onClick={() => navigate('/teacher/timetable')}
                icon={<Clock className="w-3.5 h-3.5" />}
              >
                TIMETABLE MANAGER &rarr;
              </BrutalButton>
            </div>
          </div>

          {/* Day of Week Selector Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {weekDays.map((d) => (
              <button
                key={d.num}
                onClick={() => setActiveDay(d.num)}
                className={`px-4 py-2 border-2 border-[#0F172A] text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeDay === d.num
                    ? 'bg-[#0F172A] text-white shadow-[3px_3px_0px_#A7F3D0] -translate-x-[1px] -translate-y-[1px]'
                    : 'bg-white text-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_#0F172A]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{d.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 border ${activeDay === d.num ? 'border-white text-white' : 'border-[#0F172A] bg-[#FEF08A] text-[#0F172A]'}`}>
                  6 PERIODS
                </span>
              </button>
            ))}
          </div>

          {/* Periods Schedule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDaySlots.map((slot, idx) => {
              const subObj = classFacultyList.find(
                (f) => f.subject.toLowerCase() === slot.subject_name?.toLowerCase()
              );
              const isTeacherUser = slot.teacher_name?.includes('Priya') || slot.subject_name?.includes('English');

              return (
                <BrutalCard
                  key={idx}
                  size="normal"
                  accent={isTeacherUser ? 'amber' : idx % 2 === 0 ? 'mint' : 'lavender'}
                  className="p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 bg-white border-2 border-[#0F172A] text-[11px] font-black uppercase shadow-[1.5px_1.5px_0px_#0F172A]">
                        PERIOD {slot.period_number || idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-white/70 px-2 py-0.5 border border-[#0F172A]">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm border border-[#0F172A] ${subObj?.color || 'bg-amber-300'}`} />
                        <h4 className="text-base font-extrabold text-[#0F172A] font-sans">
                          {slot.subject_name}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-600 font-mono font-bold mt-1">
                        Assigned Faculty: <span className="text-[#0F172A] font-extrabold">{slot.teacher_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-[#0F172A] flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-white border border-[#0F172A] text-[10px] font-black uppercase">
                      📍 {slot.room || 'Room 101'}
                    </span>
                    {isTeacherUser ? (
                      <span className="px-2 py-0.5 bg-[#FDE68A] border border-[#0F172A] text-[10px] font-black uppercase">
                        CLASS TEACHER SESSION
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        SUBJECT SPECIALIST
                      </span>
                    )}
                  </div>
                </BrutalCard>
              );
            })}
          </div>

          {/* Bell Routine Schedule Information */}
          <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0F172A] shrink-0" />
              <div>
                <span className="font-black text-[#0F172A]">DAILY ROUTINE TIMINGS:</span>
                <span className="text-slate-700 ml-1">
                  Morning Assembly (08:45) &bull; Morning Break (10:30 - 10:45) &bull; Lunch Recess (12:15 - 13:00) &bull; Class Dismissal (14:30)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-white border border-[#0F172A] shrink-0">
              ACADEMIC YEAR 2025-2026
            </span>
          </div>
        </div>
      )}

      {/* VIEW: STUDENT SUBJECT MARKS SHEET (CLASS TEACHER) */}
      {classroomTab === 'marks' && (
        <div className="space-y-4 font-mono">
          {/* Marks Overview Header */}
          <div className="p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] uppercase">
                  CLASS_TEACHER // ACADEMIC OVERSIGHT
                </span>
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  EVALUATIONS_CONSOLIDATED
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans">
                Student Subject Marks &amp; Merit Report &bull; {currentOption.className} ({currentOption.section})
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                As Section Mentor, inspect all marks obtained by students in your class across all 6 curriculum subjects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BrutalButton
                variant="white"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                PRINT MARKSHEET
              </BrutalButton>
              <BrutalButton
                variant="mint"
                size="sm"
                onClick={() => navigate(`/teacher/marks?class_id=${selectedClassId}&subject=${selectedSubjectId}`)}
                icon={<Award className="w-3.5 h-3.5" />}
              >
                + ENTER / EDIT MARKS &rarr;
              </BrutalButton>
            </div>
          </div>

          {/* Academic Oversight KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BrutalCard size="normal" accent="mint" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-600 uppercase">CLASS ENROLLED</span>
                <div className="text-3xl font-extrabold text-[#0F172A] mt-1">4 STUDENTS</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-bold">100% EVALUATED IN MID-TERM</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#0F172A]/15 text-[10px] font-black text-emerald-800">
                CLASS 1-A MENTOR ROSTER
              </div>
            </BrutalCard>

            <BrutalCard size="normal" accent="amber" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-600 uppercase">CLASS AVERAGE</span>
                <div className="text-3xl font-extrabold text-[#0F172A] mt-1">88.2%</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-bold">264.8 / 300 TOTAL SCORE</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#0F172A]/15 text-[10px] font-black text-amber-900">
                GRADE A ACADEMIC LEVEL
              </div>
            </BrutalCard>

            <BrutalCard size="normal" accent="lavender" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-600 uppercase">TOP SCORER</span>
                <div className="text-2xl font-extrabold text-[#0F172A] truncate mt-1">Diya Lakshmi</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-bold">283 / 300 (94.3%) &bull; GRADE A+</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#0F172A]/15 text-[10px] font-black text-indigo-900">
                🥇 SECTION RANK #1
              </div>
            </BrutalCard>

            <BrutalCard size="normal" accent="mint" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-600 uppercase">PASSING STATUS</span>
                <div className="text-3xl font-extrabold text-emerald-800 mt-1">100% PASS</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-bold">0 ACADEMIC WARNINGS</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#0F172A]/15 text-[10px] font-black text-emerald-800">
                OPTIMAL SECTION PROGRESS
              </div>
            </BrutalCard>
          </div>

          {/* Student Search and Filter Bar */}
          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search student by name or roll number (#10001)..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-[#F8FAFC] border-2 border-[#0F172A] px-3 py-1.5 pl-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500">EXAM:</span>
              <span className="px-2 py-0.5 bg-[#FEF08A] border border-[#0F172A] font-black text-[11px]">
                MID-TERM ASSESSMENT 2025 (MAX: 50 / SUBJECT)
              </span>
            </div>
          </div>

          {/* Comprehensive Student Subject Marks Matrix Table */}
          <div className="overflow-x-auto border-2 border-[#0F172A] bg-white shadow-[4px_4px_0px_#0F172A]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F172A] text-white text-[10px] uppercase font-black">
                <tr>
                  <th className="p-3 border-r border-slate-700">STUDENT ROLL &amp; NAME</th>
                  <th className="p-3 text-center border-r border-slate-700">TAMIL (50)</th>
                  <th className="p-3 text-center border-r border-slate-700 bg-amber-950 text-amber-300">
                    ENGLISH (50) ⭐
                  </th>
                  <th className="p-3 text-center border-r border-slate-700">MATHS (50)</th>
                  <th className="p-3 text-center border-r border-slate-700">SCIENCE (50)</th>
                  <th className="p-3 text-center border-r border-slate-700">SOCIAL (50)</th>
                  <th className="p-3 text-center border-r border-slate-700">COMP SCI (50)</th>
                  <th className="p-3 text-center border-r border-slate-700 bg-indigo-950 text-indigo-300">
                    TOTAL (/300)
                  </th>
                  <th className="p-3 text-center border-r border-slate-700">PCT (%)</th>
                  <th className="p-3 text-center border-r border-slate-700">GRADE</th>
                  <th className="p-3 text-center border-r border-slate-700">RANK</th>
                  <th className="p-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F172A] text-xs font-bold">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-[#FEFCE8] transition-colors">
                    <td className="p-3 border-r border-[#0F172A]">
                      <div className="font-extrabold text-[#0F172A] font-sans text-sm">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>ROLL #{st.roll}</span>
                        <span>&bull;</span>
                        <span>{st.gender}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-700">ATT: {st.attendance}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-[#0F172A] text-slate-800">{st.scores.tam}</td>
                    <td className="p-3 text-center border-r border-[#0F172A] font-black text-amber-950 bg-[#FEF08A]/40">
                      {st.scores.eng}
                      <span className="block text-[8px] font-normal text-amber-800">CLASS TEACHER</span>
                    </td>
                    <td className="p-3 text-center border-r border-[#0F172A] text-slate-800">{st.scores.mat}</td>
                    <td className="p-3 text-center border-r border-[#0F172A] text-slate-800">{st.scores.sci}</td>
                    <td className="p-3 text-center border-r border-[#0F172A] text-slate-800">{st.scores.soc}</td>
                    <td className="p-3 text-center border-r border-[#0F172A] text-slate-800">{st.scores.csc}</td>
                    <td className="p-3 text-center border-r border-[#0F172A] font-black text-indigo-950 bg-[#EEF2FF]">
                      <span className="text-sm">{st.total}</span>
                      <span className="text-[10px] text-slate-500 block">/ 300</span>
                    </td>
                    <td className="p-3 text-center border-r border-[#0F172A] font-extrabold text-slate-800">
                      {st.pct}%
                    </td>
                    <td className="p-3 text-center border-r border-[#0F172A]">
                      <span className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] font-black text-xs text-[#0F172A]">
                        {st.grade}
                      </span>
                    </td>
                    <td className="p-3 text-center border-r border-[#0F172A] font-black text-xs">
                      {st.rankBadge}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-900 text-emerald-900 font-extrabold text-[10px] uppercase">
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-[#0F172A] font-black text-[11px]">
                <tr>
                  <td className="p-3 border-r border-[#0F172A] uppercase">
                    CLASS 1-A SUBJECT AVERAGES
                  </td>
                  <td className="p-3 text-center border-r border-[#0F172A]">45.0</td>
                  <td className="p-3 text-center border-r border-[#0F172A] bg-amber-100">43.3</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">44.5</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">42.8</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">43.3</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">46.0</td>
                  <td className="p-3 text-center border-r border-[#0F172A] bg-indigo-100 text-indigo-950">
                    264.8 / 300
                  </td>
                  <td className="p-3 text-center border-r border-[#0F172A]">88.2%</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">GRADE A</td>
                  <td className="p-3 text-center border-r border-[#0F172A]">-</td>
                  <td className="p-3 text-center text-emerald-900">100% PASS</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Student Performance Comments / Observations */}
          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A]">
            <h4 className="text-xs font-black uppercase text-[#0F172A] mb-2 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-indigo-700" />
              <span>Section Mentor Academic Notes &amp; Observations:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {filteredStudents.map((st) => (
                <div key={st.id} className="p-3 bg-[#F8FAFC] border border-[#0F172A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between font-extrabold text-[#0F172A] mb-1">
                      <span>{st.name} ({st.roll})</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#FEF08A] border border-[#0F172A]">{st.rankBadge}</span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs">{st.teacherRemarks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CLASS WORKSPACE & OPERATIONS */}
      {classroomTab === 'operations' && (
        <>
      {/* Class Workspace Metrics: Active Students & Published Tests for this Class (From User Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* BOX 1: ACTIVE STUDENTS */}
        <BrutalCard size="normal" accent="amber" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
                ACTIVE STUDENTS
              </span>
              <Users className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {classActiveStudents}
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
              ENROLLED IN {currentOption.className} ({currentOption.section})
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 mt-3 pt-2 border-t border-[#0F172A]/15 uppercase">
            <span>SECTION ENROLLMENT</span>
            <span className="px-1.5 py-0.2 bg-white border border-[#0F172A] text-[9px] font-black text-emerald-800">
              CLASS {currentOption.section}
            </span>
          </div>
        </BrutalCard>

        {/* BOX 2: PUBLISHED TESTS */}
        <BrutalCard size="normal" accent="sky" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
                PUBLISHED TESTS
              </span>
              <FileCheck className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {classPublishedTests}
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
              AVAILABLE ASSESSMENTS
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 mt-3 pt-2 border-t border-[#0F172A]/15 uppercase">
            <span>SUBJECT SCOPE</span>
            <span className="px-1.5 py-0.2 bg-white border border-[#0F172A] text-[9px] font-black">
              {currentOption.subjectName}
            </span>
          </div>
        </BrutalCard>

        {/* BOX 3: CURRICULUM TEXTBOOKS */}
        <BrutalCard size="normal" accent="mint" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
                CURRICULUM BOOKS
              </span>
              <BookOpen className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {classBooks.length}
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
              INDEXED TEXTBOOKS
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 mt-3 pt-2 border-t border-[#0F172A]/15 uppercase">
            <span>AI EXTRACTION</span>
            <span className="px-1.5 py-0.2 bg-white border border-[#0F172A] text-[9px] font-black text-indigo-800">
              {classBooks.length > 0 ? 'READY' : 'STANDBY'}
            </span>
          </div>
        </BrutalCard>

        {/* BOX 4: AVERAGE ATTENDANCE */}
        <BrutalCard size="normal" accent="lavender" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-600 uppercase">
                ATTENDANCE RATE
              </span>
              <CalendarCheck2 className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              96.4%
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase">
              RECORDED THIS TERM
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 mt-3 pt-2 border-t border-[#0F172A]/15 uppercase">
            <span>ENGAGEMENT</span>
            <span className="px-1.5 py-0.2 bg-white border border-[#0F172A] text-[9px] font-black text-emerald-800">
              OPTIMAL
            </span>
          </div>
        </BrutalCard>
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
      </>
      )}

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
