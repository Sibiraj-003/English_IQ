import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Book, SchoolClass, Test, TeacherAssignment } from '../../types';
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
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Teaching subjects dropdown selection state (defaults to Class 1-A English)
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>('CLS001|sub-eng|1-A');

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

  const activeStudents = metrics?.curriculum?.total_students ?? 4;
  const publishedTests = metrics?.tests?.published_tests ?? tests.length ?? 1;

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
            ENTER CLASSROOM WORKSPACE &rarr;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BOX 1: CLASS TEACHER STATUS */}
        <BrutalCard size="normal" accent="lavender" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                CLASS TEACHER
              </span>
              <GraduationCap className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-sans">
              {mentorClassName}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600 mt-3 pt-2 border-t border-[#0F172A]/15 uppercase">
            <span>SECTION MENTOR</span>
            <span className="px-1.5 py-0.2 bg-white border border-[#0F172A] text-[9px] font-black">
              DESIGNATED IN-CHARGE
            </span>
          </div>
        </BrutalCard>

        {/* BOX 2: TEACHING SUBJECTS DROPDOWN SELECTOR (From Image 2) */}
        <BrutalCard size="normal" accent="mint" className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1.5">
              <span className="font-mono text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#0F172A]" />
                TEACHING SUBJECTS
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                SELECT CLASS
              </span>
            </div>

            {/* Custom Neo-Brutalist Dropdown */}
            <div className="relative mt-2">
              <select
                value={selectedClassSubject}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassSubject(val);
                  handleOpenClassroom(val);
                }}
                className="w-full appearance-none bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] px-2.5 py-1.5 pr-8 text-xs font-black text-[#0F172A] font-mono cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
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
          </div>

          {/* Direct Navigation Button */}
          <button
            onClick={() => handleOpenClassroom()}
            className="w-full mt-2.5 px-2 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white border border-[#0F172A] shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] font-mono text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <span>OPEN CLASS CONSOLE</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FDE68A]" />
          </button>
        </BrutalCard>

        {/* BOX 3: ACTIVE STUDENTS */}
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

        {/* BOX 4: PUBLISHED TESTS */}
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
                Click any class to enter its dedicated academic operations console
              </p>
            </div>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => handleOpenClassroom()}
            >
              LAUNCH CONSOLE &rarr;
            </BrutalButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teachingOptions.map((opt) => (
              <div
                key={`${opt.classId}-${opt.section}-${opt.subjectId}`}
                onClick={() =>
                  handleOpenClassroom(`${opt.classId}|${opt.subjectId}|${opt.section}`)
                }
                className="p-4 border-2 border-[#0F172A] bg-[#F8FAFC] hover:bg-[#FEFCE8] hover:-translate-x-[1px] hover:-translate-y-[1px] cursor-pointer transition-all shadow-[2px_2px_0px_#0F172A] flex flex-col justify-between h-32"
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
                  <p className="text-[10px] text-slate-500 font-bold">
                    Class Scope: Term 1 Curriculum Units
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-[#0F172A] pt-2 border-t border-[#0F172A]/10">
                  <span>ENTER WORKSPACE</span>
                  <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                </div>
              </div>
            ))}
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
