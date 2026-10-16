import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  Award,
  GraduationCap,
  Layers,
  HelpCircle,
  FilePlus2,
  BarChart3,
  X,
  Users,
  CalendarCheck2,
  DollarSign,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  Bell,
  Clock,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { role, user, activeChild, selectChild } = useAuth();

  const adminLinks: NavItem[] = [
    { to: '/admin/dashboard', label: 'User Directory', icon: Users, badge: 'ADMIN' },
    { to: '/admin/sections', label: 'Classes & Sections', icon: GraduationCap },
    { to: '/admin/subjects', label: 'Multi-Subject', icon: Layers },
    { to: '/admin/assignments', label: 'Teacher Allocation', icon: UserCheck },
    { to: '/admin/csv-import', label: 'Bulk CSV Onboard', icon: FileSpreadsheet, badge: 'CSV' },
    { to: '/admin/timetable', label: 'Timetable Manager', icon: Clock },
    { to: '/admin/fees', label: 'Fee Management', icon: DollarSign },
    { to: '/admin/audit-logs', label: 'Audit & Security', icon: ShieldCheck },
    { to: '/teacher/books', label: 'Curriculum Books', icon: BookOpen },
    { to: '/teacher/analytics', label: 'School Analytics', icon: BarChart3 },
  ];

  const teacherLinks: NavItem[] = [
    { to: '/teacher/dashboard', label: 'Assigned Classes', icon: LayoutDashboard },
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck2 },
    { to: '/teacher/homework', label: 'Homework & Tasks', icon: Layers },
    { to: '/teacher/marks', label: 'Exams & Marks', icon: ClipboardCheck },
    { to: '/teacher/timetable', label: 'My Timetable', icon: Clock },
    { to: '/teacher/messages', label: 'Parent Messages', icon: MessageSquare },
    { to: '/teacher/books', label: 'Textbooks', icon: BookOpen },
    { to: '/teacher/questions', label: 'AI Question Bank', icon: HelpCircle, badge: 'AI' },
    { to: '/teacher/analytics', label: 'Academic Analytics', icon: BarChart3 },
  ];

  const parentLinks: NavItem[] = [
    { to: '/parent/dashboard', label: 'Child Overview', icon: LayoutDashboard },
    { to: '/parent/attendance', label: 'Attendance Record', icon: CalendarCheck2 },
    { to: '/parent/homework', label: 'Homework & Tasks', icon: BookOpen },
    { to: '/parent/marks', label: 'Exam Results & Marks', icon: Award },
    { to: '/parent/fees', label: 'Fee Payments', icon: DollarSign },
    { to: '/parent/timetable', label: 'Class Schedule', icon: Clock },
    { to: '/parent/messages', label: 'Teacher Chat', icon: MessageSquare },
    { to: '/parent/notifications', label: 'Announcements', icon: Bell },
  ];

  const studentLinks: NavItem[] = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/ai-teacher', label: 'NOVA AI Companion', icon: Bot, badge: 'NOVA' },
    { to: '/student/lessons', label: 'Curriculum Units', icon: BookOpen },
    { to: '/student/practice', label: 'Targeted Practice', icon: Sparkles },
    { to: '/student/tests', label: 'Test Center', icon: ClipboardCheck },
    { to: '/student/progress', label: 'Mastery & Profile', icon: TrendingUp, badge: 'AI' },
    { to: '/student/achievements', label: 'Badges & Honors', icon: Award },
  ];

  const links =
    role === 'admin'
      ? adminLinks
      : role === 'teacher'
      ? teacherLinks
      : role === 'parent'
      ? parentLinks
      : studentLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r-2 border-[#0F172A] z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out font-mono ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="p-4 border-b-2 border-[#0F172A] bg-[#C4B5FD] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 border-2 border-[#0F172A] bg-white shadow-[2px_2px_0px_#0F172A] flex items-center justify-center p-1">
                <img src="/logo.svg" alt="Smart School Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-[#0F172A] tracking-tight leading-none font-sans">
                  SmartSchool
                </h1>
                <p className="text-[9px] font-bold text-slate-800 tracking-wider uppercase mt-0.5">
                  ACADEMIC PLATFORM
                </p>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 border-2 border-[#0F172A] bg-white shadow-[1.5px_1.5px_0px_#0F172A]"
              >
                <X className="w-4 h-4 text-[#0F172A]" />
              </button>
            )}
          </div>

          {/* Child Switcher for Parents */}
          {role === 'parent' && user?.children && user.children.length > 0 && (
            <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A]">
              <div className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                <span>Active Child:</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
                  {user.children.length} REGISTERED
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {user.children.map((child) => (
                  <button
                    key={child.student_id}
                    onClick={() => selectChild(child.student_id)}
                    className={`text-left px-2.5 py-1.5 border-2 border-[#0F172A] text-xs font-bold transition-all flex items-center justify-between ${
                      activeChild?.student_id === child.student_id
                        ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                        : 'bg-white text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <span>{child.student_name}</span>
                    <span className="text-[10px] opacity-90">{child.section_name || child.class_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Scope Pill */}
          {role !== 'parent' && (
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b-2 border-[#0F172A] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase text-[10px]">
                {role === 'admin' ? 'Scope:' : 'Curriculum:'}
              </span>
              <span className="font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A]">
                {role === 'admin'
                  ? 'SCHOOL_ADMIN // FULL'
                  : user?.class_id
                  ? `${user.class_id} // ACTIVE`
                  : 'CURRICULUM // ACTIVE'}
              </span>
            </div>
          )}

          {/* Navigation links */}
          <nav className="p-3 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 text-xs font-bold border-2 transition-all ${
                      isActive
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[3px_3px_0px_#C4B5FD]'
                        : 'bg-white text-[#0F172A] border-transparent hover:border-[#0F172A] hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                    <span className="tracking-wide uppercase">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t-2 border-[#0F172A] bg-[#F8FAFC]">
          <div className="text-[10px] text-slate-500 font-bold flex justify-between items-center mb-1">
            <span>ROLE_MODE:</span>
            <div className="flex items-center gap-1">
              {user?.id_number && (
                <span className="text-[9px] px-1 py-0.2 bg-[#FDE68A] text-[#0F172A] font-extrabold border border-[#0F172A]">
                  {user.id_number}
                </span>
              )}
              <span className="text-[#0F172A] font-extrabold uppercase">{role}</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-mono">
            ENG-IQ ACADEMIC v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
