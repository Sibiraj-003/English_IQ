import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  BookOpen,
  DollarSign,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();

  const getLinks = () => {
    if (role === 'parent') {
      return [
        { to: '/parent/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/parent/attendance', label: 'Attendance', icon: CalendarCheck2 },
        { to: '/parent/homework', label: 'Homework', icon: BookOpen },
        { to: '/parent/fees', label: 'Fees', icon: DollarSign },
        { to: '/parent/messages', label: 'Chat', icon: MessageSquare },
      ];
    }
    if (role === 'teacher') {
      return [
        { to: '/teacher/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck2 },
        { to: '/teacher/homework', label: 'Homework', icon: BookOpen },
        { to: '/teacher/marks', label: 'Marks', icon: ClipboardList },
        { to: '/teacher/messages', label: 'Chat', icon: MessageSquare },
      ];
    }
    if (role === 'student') {
      return [
        { to: '/student/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/student/lessons', label: 'Lessons', icon: BookOpen },
        { to: '/student/ai-teacher', label: 'AI Tutor', icon: Sparkles },
        { to: '/student/tests', label: 'Tests', icon: ClipboardList },
      ];
    }
    // Admin
    return [
      { to: '/admin/dashboard', label: 'Admin', icon: GraduationCap },
      { to: '/admin/sections', label: 'Sections', icon: BookOpen },
      { to: '/admin/fees', label: 'Fees', icon: DollarSign },
      { to: '/admin/timetable', label: 'Schedule', icon: CalendarCheck2 },
    ];
  };

  const links = getLinks();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#0F172A] shadow-[0px_-2px_0px_#0F172A] flex justify-around items-center px-1 py-1.5 font-mono">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xs transition-all ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#C4B5FD]'
                  : 'text-[#0F172A] hover:bg-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4 stroke-[2.2]" />
            <span className="text-[10px] font-extrabold uppercase mt-0.5 tracking-tighter">
              {link.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
