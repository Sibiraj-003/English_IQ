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
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { role, user } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'User Directory', icon: Users, badge: 'ADMIN' },
    { to: '/teacher/classes', label: 'Classes & Levels', icon: GraduationCap },
    { to: '/teacher/books', label: 'Textbooks', icon: BookOpen },
    { to: '/teacher/lessons', label: 'Lessons', icon: Layers },
    { to: '/teacher/questions', label: 'Question Bank', icon: HelpCircle, badge: 'AI' },
    { to: '/teacher/tests', label: 'Test Builder', icon: FilePlus2 },
    { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/lessons', label: 'My Lessons', icon: BookOpen },
    { to: '/student/ai-teacher', label: 'AI Teacher', icon: Bot, badge: 'RAG' },
    { to: '/student/practice', label: 'Practice', icon: Sparkles },
    { to: '/student/tests', label: 'Tests', icon: ClipboardCheck },
    { to: '/student/progress', label: 'Progress', icon: TrendingUp },
    { to: '/student/achievements', label: 'Achievements', icon: Award },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/classes', label: 'Classes', icon: GraduationCap },
    { to: '/teacher/books', label: 'Textbooks', icon: BookOpen },
    { to: '/teacher/lessons', label: 'Lessons', icon: Layers },
    { to: '/teacher/questions', label: 'Question Bank', icon: HelpCircle, badge: 'AI' },
    { to: '/teacher/tests', label: 'Test Builder', icon: FilePlus2 },
    { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

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
        <div>
          {/* Logo & Brand Header */}
          <div className="p-4 border-b-2 border-[#0F172A] bg-[#C4B5FD] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 border-2 border-[#0F172A] bg-white shadow-[2px_2px_0px_#0F172A] flex items-center justify-center p-1">
                <img src="/logo.svg" alt="EnglishIQ Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-[#0F172A] tracking-tight leading-none font-sans">
                  EnglishIQ
                </h1>
                <p className="text-[9px] font-bold text-slate-800 tracking-wider uppercase mt-0.5">
                  AI LEARNING PORTAL
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

          {/* Active Class Pill */}
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

          {/* Navigation links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto">
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
