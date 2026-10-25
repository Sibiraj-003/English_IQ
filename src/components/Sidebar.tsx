import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  User,
  ChevronLeft,
  ChevronRight,
  History,
  Plus,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { role, user, activeChild, selectChild } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const storageKey = `nova_chat_sessions_${user?.id || 'default'}`;
  const activeSessionKey = `nova_active_session_id_${user?.id || 'default'}`;

  const [chatSessions, setChatSessions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(activeSessionKey);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncSessions = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setChatSessions(JSON.parse(saved));
        const activeId = localStorage.getItem(activeSessionKey);
        if (activeId) setActiveSessionId(activeId);
      } catch {}
    };

    window.addEventListener('nova_sessions_updated', syncSessions);
    window.addEventListener('storage', syncSessions);
    return () => {
      window.removeEventListener('nova_sessions_updated', syncSessions);
      window.removeEventListener('storage', syncSessions);
    };
  }, [storageKey, activeSessionKey]);

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
    { to: '/teacher/ai-assistant', label: 'Teacher AI Copilot', icon: Bot },
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
    { to: '/student/progress', label: 'Mastery & Growth', icon: TrendingUp, badge: 'AI' },
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
        className={`fixed md:static top-0 left-0 h-screen md:h-full bg-white border-r-2 border-[#0F172A] z-50 flex flex-col justify-between transition-all duration-300 ease-in-out font-mono shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed
            ? 'md:w-0 md:-translate-x-full md:border-r-0 md:opacity-0 pointer-events-none md:overflow-hidden'
            : 'md:w-64 md:translate-x-0 md:opacity-100 pointer-events-auto w-64'
        }`}
      >
        <div className="overflow-y-auto flex-1 min-h-0">
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

            <div className="flex items-center gap-1.5">
              {onClose && (
                <button
                  onClick={onClose}
                  className="md:hidden p-1 border-2 border-[#0F172A] bg-white shadow-[1.5px_1.5px_0px_#0F172A]"
                >
                  <X className="w-4 h-4 text-[#0F172A]" />
                </button>
              )}
            </div>
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
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 whitespace-nowrap shrink-0 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Student Chat History (Positioned below Badges & Honors as marked by user) */}
          {role === 'student' && (
            <div className="p-3 border-t-2 border-[#0F172A] bg-[#FEFCE8]/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#0F172A]" />
                  <span className="text-[11px] font-black uppercase text-[#0F172A] tracking-wider">
                    CHAT SESSIONS
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                    {chatSessions.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('nova_start_new_chat'));
                    if (location.pathname !== '/student/ai-teacher') {
                      navigate('/student/ai-teacher');
                    }
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-[#A7F3D0] hover:bg-[#6EE7B7] text-[#0F172A] border border-[#0F172A] text-[10px] font-black shadow-[1px_1px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  title="Start fresh new chat"
                >
                  <Plus className="w-3 h-3" />
                  <span>NEW</span>
                </button>
              </div>

              {/* Sessions list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {chatSessions.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic p-2 border border-dashed border-slate-300 bg-white text-center">
                    No past chat sessions yet.
                  </div>
                ) : (
                  chatSessions.slice(0, 10).map((sess) => {
                    const isActive = sess.id === activeSessionId && location.pathname === '/student/ai-teacher';
                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          localStorage.setItem(activeSessionKey, sess.id);
                          setActiveSessionId(sess.id);
                          window.dispatchEvent(
                            new CustomEvent('nova_select_session', { detail: { sessionId: sess.id } })
                          );
                          if (location.pathname !== '/student/ai-teacher') {
                            navigate('/student/ai-teacher');
                          }
                          if (onClose) onClose();
                        }}
                        className={`p-1.5 border-2 border-[#0F172A] text-left transition-all cursor-pointer select-none flex items-center justify-between group ${
                          isActive
                            ? 'bg-[#FDE68A] shadow-[2px_2px_0px_#0F172A] font-extrabold text-[#0F172A]'
                            : 'bg-white hover:bg-slate-50 text-slate-800 shadow-[1px_1px_0px_#0F172A]'
                        }`}
                        title={sess.title || sess.topic || 'Chat Session'}
                      >
                        <div className="min-w-0 flex-1 mr-1">
                          <div className="truncate text-[11px] font-bold leading-tight">
                            {sess.title || sess.topic || 'Chat Session'}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                            <span>{sess.subject_name || 'Science'}</span>
                            <span>•</span>
                            <span>{sess.messages?.length || 1} msgs</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent('nova_delete_session', { detail: { sessionId: sess.id } })
                            );
                            const updated = chatSessions.filter((s) => s.id !== sess.id);
                            setChatSessions(updated);
                            localStorage.setItem(storageKey, JSON.stringify(updated));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Delete chat session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Student Profile Card (Moved here in place of ROLE_MODE) */}
        <div className="p-2.5 border-t-2 border-[#0F172A] bg-[#F8FAFC] space-y-1.5 shrink-0">
          {role === 'student' ? (
            <NavLink
              to="/student/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between p-2 border-2 transition-all group ${
                  isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[2.5px_2.5px_0px_#C4B5FD]'
                    : 'bg-white text-[#0F172A] border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-[#FEF9C3] hover:shadow-[3px_3px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px]'
                }`
              }
              title="View & Edit Student Profile"
            >
              <div className="flex items-center gap-2 min-w-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Profile'}
                    className="w-8 h-8 rounded-full border-2 border-[#0F172A] object-cover shrink-0 bg-[#FDE68A]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-[#0F172A] bg-[#C4B5FD] flex items-center justify-center font-black text-xs shrink-0 text-[#0F172A]">
                    {(user?.full_name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black truncate uppercase tracking-tight">
                    {user?.full_name || 'Student'}
                  </p>
                  <div className="flex items-center gap-1">
                    {user?.id_number && (
                      <span className="text-[9px] px-1 py-0.2 bg-[#FDE68A] text-[#0F172A] font-extrabold border border-[#0F172A] leading-none">
                        {user.id_number}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      Profile
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </NavLink>
          ) : (
            <div className="flex items-center justify-between p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full border-2 border-[#0F172A] bg-[#C4B5FD] flex items-center justify-center font-black text-xs shrink-0 text-[#0F172A]">
                  {(user?.full_name || role || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black truncate uppercase tracking-tight text-[#0F172A]">
                    {user?.full_name || 'User'}
                  </p>
                  <span className="text-[9px] font-extrabold px-1 py-0.2 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] uppercase">
                    {role}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1 text-[9px] text-slate-400 font-mono">
            <span>ENG-IQ ACADEMIC v1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="System Online" />
          </div>
        </div>
      </aside>
    </>
  );
};
