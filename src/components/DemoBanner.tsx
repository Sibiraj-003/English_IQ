import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { role, user } = useAuth();

  return (
    <div className="bg-[#FDE68A] border-b-2 border-[#0F172A] px-3 sm:px-4 py-1.5 font-mono text-xs flex flex-wrap items-center justify-between gap-2 shadow-[0px_2px_0px_#0F172A] shrink-0">
      <div className="flex items-center gap-2 font-bold text-[#0F172A]">
        <span className="px-1.5 py-0.5 bg-[#0F172A] text-white uppercase text-[10px] tracking-wider">
          ACADEMIC_PORTAL
        </span>
        <span className="hidden sm:inline">Active Curriculum:</span>
        <span className="bg-white px-2 py-0.5 border border-[#0F172A] text-[#0F172A] flex items-center gap-1 font-extrabold">
          <BookOpen className="w-3 h-3 text-emerald-600" />
          {role === 'student' ? (user?.class_id || 'CLASS_01') : 'ALL CLASSES'}
        </span>
        <span className="text-slate-600 hidden md:inline">
          Logged in as: <strong className="text-[#0F172A]">{user?.full_name}</strong> ({role.toUpperCase()}{user?.id_number ? ` • ${user.id_number}` : ''})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-white text-[#0F172A] border border-[#0F172A] font-extrabold text-[10px] flex items-center gap-1 shadow-[1px_1px_0px_#0F172A]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          SUPABASE AUTH // VERIFIED
        </span>
      </div>
    </div>
  );
};
