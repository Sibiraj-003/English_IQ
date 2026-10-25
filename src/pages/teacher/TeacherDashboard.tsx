import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Book, SchoolClass, Test, TeacherAssignment, TimetableSlot, MarkEntry } from '../../types';
import {
  GraduationCap,
  BookOpen,
  Users,
  FileCheck,
  Plus,
  Upload,
  ArrowRight,
  ChevronDown,
  Clock,
  Sparkles,
  CalendarCheck2,
  CheckCircle2,
  Layers,
  School,
  Bot,
  ClipboardList,
  Award,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
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

  // Tab state inside Box 1: subjects | timetable | marks
  const [oversightTab, setOversightTab] = useState<'subjects' | 'timetable' | 'marks'>('subjects');
  const [activeTimetableDay, setActiveTimetableDay] = useState<number>(1);

  // Teaching subjects dropdown selection state (defaults to Class 1-A English)
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>('CLS001|sub-eng|1-A');

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Class teacher / mentor class resolution
  const mentorClassName =
    user?.section_name && user?.class_name
      ? `${user.class_name} (${user.section_name})`
      : user?.class_name
        ? `${user.class_name}-A`
        : 'CLASS 1-A';

  // Teaching options available for dropdown
  const teachingOptions = [
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-eng', subjectName: 'English' },
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-mat', subjectName: 'Mathematics' },
    { classId: 'CLS001', className: 'Class 1', section: '1-A', subjectId: 'sub-sci', subjectName: 'Science' },
    { classId: 'CLS001', className: 'Class 1', section: '1-B', subjectId: 'sub-eng', subjectName: 'English' },
    { classId: 'CLS002', className: 'Class 2', section: '2-A', subjectId: 'sub-mat', subjectName: 'Mathematics' },
  ];

  const handleOpenClassroom = (val?: string) => {
    const target = val || selectedClassSubject || 'CLS001|sub-eng|1-A';
    const [cId, sId, sec] = target.split('|');
    navigate(`/teacher/classroom/${cId}?subject=${sId}&section=${sec}`);
  };

  // Curated default subjects studied by Class 1-A students with their assigned faculty
  const defaultClassSubjects = [
    { subjectId: 'sub-tam', code: 'TAM101', name: 'Tamil', teacher: 'K. Murugan', role: 'Tamil Faculty', color: 'bg-emerald-400' },
    { subjectId: 'sub-eng', code: 'ENG101', name: 'English', teacher: 'Priya Sharma (Class Teacher)', isMentor: true, role: 'Languages Dept', color: 'bg-amber-300' },
    { subjectId: 'sub-mat', code: 'MAT101', name: 'Mathematics', teacher: 'Ravi Varma', role: 'Math Specialist', color: 'bg-indigo-300' },
    { subjectId: 'sub-sci', code: 'SCI101', name: 'Science', teacher: 'Suresh Raina', role: 'Science Dept', color: 'bg-cyan-300' },
    { subjectId: 'sub-soc', code: 'SOC101', name: 'Social Science', teacher: 'Meenakshi Sundaram', role: 'Social Studies', color: 'bg-rose-300' },
    { subjectId: 'sub-cs', code: 'CSC101', name: 'Computer Science', teacher: 'Arun Prakash', role: 'Technology Dept', color: 'bg-purple-300' },
  ];

  // Resolve subjects & teachers strictly for Section 1-A without cross-section contamination or duplicates
  const sec1AAssignments = assignments.filter(
    (a) => a.section_id === 'SEC-1A' && a.is_active
  );

  // Deduplicate by subject_id to ensure exactly 1 entry per subject (6 unique subjects)
  const uniqueSecAssignments = Array.from(
    new Map(sec1AAssignments.map((a) => [a.subject_id, a])).values()
  );

  const classSubjectsWithStaff =
    uniqueSecAssignments.length >= 3
      ? uniqueSecAssignments.map((a) => {
        const isUser = a.teacher_id === user?.id || a.teacher_name?.includes('Priya');
        const defaultMatch = defaultClassSubjects.find(
          (d) =>
            d.name.toLowerCase() === a.subject_name?.toLowerCase() ||
            (a.subject_id && d.subjectId === a.subject_id)
        );
        return {
          subjectId: a.subject_id || defaultMatch?.subjectId || 'sub-eng',
          code: (a as any).subject_code || defaultMatch?.code || 'SUB101',
          name: a.subject_name || defaultMatch?.name || 'Subject',
          teacher: a.teacher_name || defaultMatch?.teacher || 'Assigned Staff',
          isMentor: isUser,
          role: isUser ? 'Class Teacher' : defaultMatch?.role || 'Subject Faculty',
          color: defaultMatch?.color || 'bg-amber-300',
        };
      })
      : defaultClassSubjects;

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
            Welcome back, {user?.full_name || 'Teacher Priya'}! Choose your assigned class and subject below to enter the class operations workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <BrutalButton
            variant="mint"
            size="sm"
            onClick={() => handleOpenClassroom()}
            icon={<GraduationCap className="w-3.5 h-3.5" />}
          >
            ENTER CLASS WORKSPACE &rarr;
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

      {/* Teacher AI Copilot Live Assistant Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#0F172A] bg-[#FEF08A] shadow-[2px_2px_0px_#0F172A]">
            <Bot className="h-7 w-7 text-[#0F172A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-black text-base text-[#0F172A]">
                Teacher AI Copilot (Live Data Assistant)
              </span>
              <span className="inline-flex items-center gap-1 border border-[#0F172A] bg-[#A7F3D0] px-2 py-0.5 text-[10px] font-black text-[#0F172A]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                VOICE & CHAT
              </span>
            </div>
            <p className="font-mono text-xs text-slate-700 mt-0.5">
              Query student mastery, track who scored under 60%, check absentees, pending homework, or draft notices in seconds.
            </p>
          </div>
        </div>
        <BrutalButton
          variant="amber"
          size="sm"
          onClick={() => navigate('/teacher/ai-assistant')}
          icon={<Bot className="w-4 h-4" />}
        >
          LAUNCH LIVE AI COPILOT &rarr;
        </BrutalButton>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* BOX 1: CLASS TEACHER STATUS & STUDENT CURRICULUM SUBJECTS / TEACHING STAFF DIRECTORY / TIMETABLE / MARKS */}
        <BrutalCard size="normal" accent="lavender" className="lg:col-span-7 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                CLASS TEACHER // ACADEMIC OVERSIGHT
              </span>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white border border-[#0F172A] text-[9px] font-black uppercase">
                  DESIGNATED IN-CHARGE
                </span>
                <GraduationCap className="w-5 h-5 text-[#0F172A]" />
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-sans">
                  {mentorClassName}
                </div>
                <div className="text-[11px] font-mono text-slate-600 font-bold">
                  Section Mentor: {user?.full_name || 'Priya Sharma (Teacher)'}
                </div>
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] uppercase">
                {classSubjectsWithStaff.length} CURRICULUM SUBJECTS
              </span>
            </div>

            <p className="text-xs text-slate-700 font-mono mb-4 leading-relaxed">
              Section Academic Oversight &amp; Student Routine Console. Launch the dedicated Class Navigation Page to access full student curriculum subjects with assigned faculty, weekly period schedule, and consolidated subject marksheet.
            </p>

            {/* Feature Overview Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono mb-4">
              <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#0F172A]">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SUBJECTS &amp; STAFF</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold mt-1">
                  {classSubjectsWithStaff.length} Faculty Allocations
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#0F172A]">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CLASS TIMETABLE</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold mt-1">
                  6 Periods Daily Routine
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#0F172A]">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>STUDENT MARKS</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold mt-1">
                  Consolidated Scorecard
                </div>
              </div>
            </div>

            {/* Direct Navigation Button to Next Page */}
            <button
              onClick={() => handleOpenClassroom('CLS001|sub-eng|1-A')}
              className="w-full px-4 py-3 bg-[#A7F3D0] hover:bg-[#6EE7B7] text-[#0F172A] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] font-mono text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>OPEN CLASS 1-A NAVIGATION PAGE</span>
              <ArrowRight className="w-4 h-4 text-[#0F172A]" />
            </button>
          </div>

          {/* Quick Deep Link Shortcuts */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono font-extrabold text-slate-700 mt-4 pt-3 border-t-2 border-[#0F172A] gap-2">
            <span className="text-[10px] text-slate-500 uppercase">DIRECT JUMP:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => navigate('/teacher/classroom/CLS001?subject=sub-eng&section=1-A&tab=subjects')}
                className="px-2 py-0.5 bg-white hover:bg-[#FEF08A] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[10px] font-black cursor-pointer transition-all"
              >
                [ 📚 Subjects &amp; Staff ]
              </button>
              <button
                onClick={() => navigate('/teacher/classroom/CLS001?subject=sub-eng&section=1-A&tab=timetable')}
                className="px-2 py-0.5 bg-white hover:bg-[#A7F3D0] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[10px] font-black cursor-pointer transition-all"
              >
                [ 🕒 Timetable ]
              </button>
              <button
                onClick={() => navigate('/teacher/classroom/CLS001?subject=sub-eng&section=1-A&tab=marks')}
                className="px-2 py-0.5 bg-white hover:bg-[#C4B5FD] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[10px] font-black cursor-pointer transition-all"
              >
                [ 📊 Subject Marks ]
              </button>
            </div>
          </div>
        </BrutalCard>

        {/* BOX 2: TEACHING SUBJECTS DROPDOWN SELECTOR (From Image 2) */}
        <BrutalCard size="normal" accent="mint" className="lg:col-span-5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#0F172A]" />
                TEACHING SUBJECTS // WORKSPACE
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                SELECT CLASS
              </span>
            </div>

            <p className="text-xs text-slate-600 font-mono mb-3">
              Switch between your teaching sections to launch the class operations workspace or assign coursework.
            </p>

            {/* Custom Neo-Brutalist Dropdown */}
            <div className="relative mb-3">
              <select
                value={selectedClassSubject}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassSubject(val);
                  handleOpenClassroom(val);
                }}
                className="w-full appearance-none bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] px-2.5 py-2 pr-8 text-xs font-black text-[#0F172A] font-mono cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                title="Choose class and subject to open dedicated workspace"
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

            {/* Direct Navigation Button */}
            <button
              onClick={() => handleOpenClassroom()}
              className="w-full px-3 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] font-mono text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>ENTER CLASS WORKSPACE</span>
              <ArrowRight className="w-4 h-4 text-[#FDE68A]" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#0F172A]/15 font-mono">
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="p-2.5 bg-white border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-slate-50 text-left text-[11px] font-black text-[#0F172A] flex items-center justify-between"
            >
              <span>MARK ATTENDANCE</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => navigate('/teacher/ai-assistant')}
              className="p-2.5 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-amber-100 text-left text-[11px] font-black text-[#0F172A] flex items-center justify-between"
            >
              <span>AI COPILOT</span>
              <span>&rarr;</span>
            </button>
          </div>
        </BrutalCard>
      </div>

      {/* Classroom Quick Launchpad & Daily Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Assigned Classes Quick Launch Grid */}
        <BrutalCard size="large" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
            <div>
              <span className="font-extrabold text-sm text-[#0F172A] uppercase flex items-center gap-2">
                <School className="w-4 h-4 text-[#0F172A]" />
                ASSIGNED_CLASSES // DIRECT ACCESS
              </span>
              <p className="text-[11px] text-slate-500">
                Click any class to enter its dedicated academic workspace
              </p>
            </div>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => handleOpenClassroom()}
            >
              ENTER CLASS WORKSPACE &rarr;
            </BrutalButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teachingOptions.map((opt) => {
              const studentCount = opt.classId === 'CLS002' ? 2 : opt.section === '1-B' ? 3 : 4;
              const testCount = opt.classId === 'CLS001' ? 1 : 1;
              return (
                <div
                  key={`${opt.classId}-${opt.section}-${opt.subjectId}`}
                  onClick={() =>
                    handleOpenClassroom(`${opt.classId}|${opt.subjectId}|${opt.section}`)
                  }
                  className="p-4 border-2 border-[#0F172A] bg-[#F8FAFC] hover:bg-[#FEFCE8] hover:-translate-x-[1px] hover:-translate-y-[1px] cursor-pointer transition-all shadow-[2px_2px_0px_#0F172A] flex flex-col justify-between h-36"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white uppercase">
                        {opt.className} - {opt.section}
                      </span>
                      <Badge variant={opt.section === '1-A' ? 'mint' : 'lavender'}>
                        {opt.section === '1-A' ? 'MENTOR' : 'FACULTY'}
                      </Badge>
                    </div>
                    <h4 className="font-sans text-base font-extrabold text-[#0F172A] mt-1">
                      {opt.subjectName}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1">
                      <span>{studentCount} Students</span>
                      <span>•</span>
                      <span>{testCount} Tests</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-black text-[#0F172A] pt-2 border-t border-[#0F172A]/10">
                    <span>CLASS WORKSPACE</span>
                    <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                  </div>
                </div>
              );
            })}
          </div>
        </BrutalCard>

        {/* Today's Teaching Schedule / Period Slots */}
        <BrutalCard size="large" accent="lavender" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-3">
              <span className="font-extrabold text-sm text-[#0F172A] uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0F172A]" />
                TODAY'S SCHEDULE
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#A7F3D0] border border-[#0F172A] font-black">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-[#0F172A]">PERIOD 1 &bull; 09:00 - 09:45 AM</span>
                  <div className="text-[11px] text-slate-600 font-bold">Class 1 (1-A) &bull; English Reader</div>
                </div>
                <span className="text-[10px] px-1 bg-[#A7F3D0] border border-[#0F172A] font-extrabold">ROOM 101</span>
              </div>

              <div className="p-2.5 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-[#0F172A]">PERIOD 2 &bull; 09:50 - 10:35 AM</span>
                  <div className="text-[11px] text-slate-600 font-bold">Class 1 (1-A) &bull; Mathematics</div>
                </div>
                <span className="text-[10px] px-1 bg-white border border-[#0F172A] font-bold">ROOM 101</span>
              </div>

              <div className="p-2.5 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-[#0F172A]">PERIOD 3 &bull; 10:50 - 11:35 AM</span>
                  <div className="text-[11px] text-slate-600 font-bold">Class 2 (2-A) &bull; Mathematics</div>
                </div>
                <span className="text-[10px] px-1 bg-white border border-[#0F172A] font-bold">ROOM 201</span>
              </div>
            </div>
          </div>

          <BrutalButton
            variant="primary"
            onClick={() => navigate('/teacher/timetable')}
            className="w-full mt-4"
            icon={<Clock className="w-3.5 h-3.5" />}
          >
            VIEW FULL TIMETABLE
          </BrutalButton>
        </BrutalCard>
      </div>
    </div>
  );
};
