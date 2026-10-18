import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Volume2, VolumeX, LogOut, Cpu, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, role, isGroqOnline, logout } = useAuth();
  const [sfxOn, setSfxOn] = useState(false);
  const location = useLocation();

  // Generate breadcrumb from path
  const getBreadcrumb = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'PORTAL / DASHBOARD';
    return parts.map((p) => p.toUpperCase().replace(/-/g, '_')).join(' / ');
  };

  return (
    <header className="bg-white border-b-2 border-[#0F172A] px-3 md:px-5 py-2 md:py-2.5 flex items-center justify-between shadow-[0px_2px_0px_#0F172A] shrink-0 font-mono z-30">
      {/* Left: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 border-2 border-[#0F172A] bg-white shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Menu className="w-5 h-5 text-[#0F172A]" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            ACADEMIC_OS //
          </span>
          <span className="text-sm font-extrabold text-[#0F172A] tracking-wide">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Right side status and controls */}
      <div className="flex items-center gap-3">

        {/* SFX Toggle */}
        <button
          onClick={() => setSfxOn(!sfxOn)}
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            sfxOn ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-slate-100 text-slate-700'
          }`}
          title="Toggle UI Sound Effects"
        >
          {sfxOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{sfxOn ? 'SFX ON' : 'SFX OFF'}</span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="w-5 h-5 rounded-sm bg-[#C4B5FD] border border-[#0F172A] flex items-center justify-center font-bold text-[10px]">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-bold text-[#0F172A] hidden sm:inline max-w-[120px] truncate">
            {user?.full_name}
          </span>
          {user?.id_number && (
            <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] hidden md:inline">
              ID: {user.id_number}
            </span>
          )}
          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white">
            {role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-1.5 text-xs border-2 border-[#0F172A] bg-white text-[#0F172A] hover:bg-rose-50 hover:text-rose-600 shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px]"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
