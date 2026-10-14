import React, { useState, useEffect } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Zap,
  Lock,
  Star,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

export const StudentAchievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'Attendance' | 'Responsibility' | 'Excellence'>('all');
  const [loading, setLoading] = useState(true);

  const iconMap: Record<string, any> = {
    UserCheck: UserCheck,
    ShieldCheck: ShieldCheck,
    CheckCircle: CheckCircle2,
    Award: Award,
    Flame: Flame,
    BookOpen: BookOpen,
    Zap: Zap,
    ClipboardCheck: ClipboardCheck,
  };

  useEffect(() => {
    if (!user) return;
    api.getStudentProgress(user.id)
      .then((data) => {
        if (data?.achievements) {
          setAchievements(data.achievements);
        }
      })
      .catch((err) => {
        console.error('Error fetching achievements:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length || 7;
  const percentComplete = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + (a.points || 100), 0);

  const filteredAchievements = achievements.filter((a) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'Attendance') return a.category === 'Attendance';
    if (activeCategory === 'Responsibility') return a.category === 'Responsibility';
    if (activeCategory === 'Excellence') return a.category === 'Excellence' || a.category === 'Curriculum';
    return true;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
              ACADEMIC_ACHIEVEMENTS // MERIT_BOARD
            </span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              BADGES SYSTEM // ACTIVE
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-0.5">
            Student Merit Badges & Honors
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Awarding official badges for active student portal attendance, test evaluation responsibility, and curriculum mastery.
          </p>
        </div>

        {/* Progress & Merit Score Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="text-[10px] text-slate-600 font-extrabold uppercase">BADGES UNLOCKED</div>
            <div className="text-lg font-extrabold text-[#0F172A] font-sans leading-tight">
              {unlockedCount} / {totalCount} ({percentComplete}%)
            </div>
          </div>

          <div className="p-3 bg-[#0F172A] text-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#A7F3D0] flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            <div>
              <div className="text-[10px] text-slate-300 font-bold uppercase">TOTAL MERIT POINTS</div>
              <div className="text-lg font-extrabold text-[#A7F3D0] font-sans leading-none">{totalPoints} PTS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Badges Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Highlight Card */}
        <div className="p-4 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-start gap-3">
          <div className="w-10 h-10 bg-white border-2 border-[#0F172A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0F172A]">
            <UserCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white">
                ATTENDANCE BADGE
              </span>
              <span className="text-[10px] font-extrabold text-emerald-900 bg-white/70 px-1.5 border border-[#0F172A]">
                ALWAYS ACTIVE
              </span>
            </div>
            <div className="text-sm font-extrabold text-[#0F172A] font-sans">
              Committed Attendee Badge
            </div>
            <p className="text-xs text-[#0F172A]/80 font-sans mt-0.5">
              Awarded to students for showing up and attending the EnglishIQ learning portal ready to learn.
            </p>
          </div>
        </div>

        {/* Responsibility Highlight Card */}
        <div className="p-4 bg-[#C4B5FD] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-start gap-3">
          <div className="w-10 h-10 bg-white border-2 border-[#0F172A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0F172A]">
            <ShieldCheck className="w-5 h-5 text-indigo-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white">
                RESPONSIBILITY BADGE
              </span>
              <span className="text-[10px] font-extrabold text-indigo-950 bg-white/70 px-1.5 border border-[#0F172A]">
                ASSESSMENT DUTY
              </span>
            </div>
            <div className="text-sm font-extrabold text-[#0F172A] font-sans">
              Test Responsibility Badge
            </div>
            <p className="text-xs text-[#0F172A]/80 font-sans mt-0.5">
              Awarded to students who take responsibility by attending and submitting class test assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b-2 border-[#0F172A]">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-extrabold border-2 border-[#0F172A] transition-all ${
            activeCategory === 'all'
              ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          ALL BADGES ({achievements.length})
        </button>

        <button
          onClick={() => setActiveCategory('Attendance')}
          className={`px-3 py-1.5 text-xs font-extrabold border-2 border-[#0F172A] transition-all flex items-center gap-1.5 ${
            activeCategory === 'Attendance'
              ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          ATTENDANCE BADGES ({achievements.filter((a) => a.category === 'Attendance').length})
        </button>

        <button
          onClick={() => setActiveCategory('Responsibility')}
          className={`px-3 py-1.5 text-xs font-extrabold border-2 border-[#0F172A] transition-all flex items-center gap-1.5 ${
            activeCategory === 'Responsibility'
              ? 'bg-[#C4B5FD] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          RESPONSIBILITY BADGES ({achievements.filter((a) => a.category === 'Responsibility').length})
        </button>

        <button
          onClick={() => setActiveCategory('Excellence')}
          className={`px-3 py-1.5 text-xs font-extrabold border-2 border-[#0F172A] transition-all flex items-center gap-1.5 ${
            activeCategory === 'Excellence'
              ? 'bg-[#FDE68A] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          ACADEMIC EXCELLENCE ({achievements.filter((a) => a.category === 'Excellence' || a.category === 'Curriculum').length})
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAchievements.map((ach) => {
          const Icon = iconMap[ach.icon] || Award;
          const isAttendance = ach.category === 'Attendance';
          const isResponsibility = ach.category === 'Responsibility';
          const isExcellence = ach.category === 'Excellence';

          const cardAccent = ach.unlocked
            ? isAttendance
              ? 'mint'
              : isResponsibility
              ? 'lavender'
              : 'amber'
            : 'none';

          const badgeIconBg = ach.unlocked
            ? isAttendance
              ? 'bg-[#A7F3D0]'
              : isResponsibility
              ? 'bg-[#C4B5FD]'
              : 'bg-[#FDE68A]'
            : 'bg-slate-200';

          return (
            <BrutalCard
              key={ach.id}
              size="normal"
              accent={cardAccent}
              className={`p-6 flex flex-col justify-between transition-all ${
                ach.unlocked
                  ? 'bg-white hover:-translate-y-1'
                  : 'bg-slate-50 opacity-85 border-dashed'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A] ${badgeIconBg}`}
                  >
                    {ach.unlocked ? (
                      <Icon className="w-6 h-6 text-[#0F172A]" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={ach.unlocked ? 'mint' : 'white'}>
                      {ach.unlocked ? 'EARNED' : 'LOCKED'}
                    </Badge>
                    {ach.badge_type && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-[#FEFCE8] border border-[#0F172A] text-[#0F172A]">
                        {ach.badge_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {ach.category || 'Curriculum'}
                </div>

                <h3 className="text-base font-extrabold text-[#0F172A] font-sans mb-2 leading-tight">
                  {ach.title}
                </h3>

                <p className="text-xs text-slate-600 font-sans leading-relaxed mb-4">
                  {ach.description}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-[#0F172A] text-[11px] font-bold text-slate-500 flex justify-between items-center">
                <span className={ach.unlocked ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
                  {ach.unlocked ? 'STATUS: UNLOCKED' : 'IN PROGRESS'}
                </span>
                <span className="text-[#0F172A] font-extrabold bg-[#FEFCE8] px-1.5 py-0.5 border border-[#0F172A]">
                  +{ach.points || 100} PTS
                </span>
              </div>
            </BrutalCard>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAchievements;
