import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StudentProgressData, Test, Lesson } from '../../types';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Flame,
  Bot,
  Sparkles,
  ArrowRight,
  ClipboardCheck,
  Award,
  UserCheck,
  ShieldCheck,
  Star,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [prog, tList, lList, attList] = await Promise.all([
          api.getStudentProgress(user.id),
          api.getTests({ class_id: user.class_id || undefined, published_only: true }),
          api.getLessons({ class_id: user.class_id || undefined }),
          api.getStudentAttempts(user.id),
        ]);
        setProgress(prog);
        setTests(tList);
        setLessons(lList);
        setAttempts(attList);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const learningProgressPercent = progress?.learning_progress_percent ?? 0;
  const lessonsCompletedText = progress?.lessons_completed || '0 / 0';
  const avgScore = progress?.average_score ?? 0;
  const currentStreak = progress?.current_streak_days ?? 0;
  const recentAttempts = progress?.recent_attempts || [];
  const recommendedLesson = lessons.length > 0 ? lessons[0] : null;
  const unlockedBadgesCount = progress?.achievements?.filter((a) => a.unlocked).length || 1;
  const totalBadgesCount = progress?.achievements?.length || 7;
  const hasTestResponsibility = progress?.achievements?.some((a) => a.id === 'ach-responsibility' && a.unlocked) || (recentAttempts.length > 0);

  return (
    <div className="space-y-6 font-mono">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
              STUDENT_PORTAL // CLASS_CONSOLE
            </span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              LEARNING_MODE // ACTIVE
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
            Welcome back, {user?.full_name || 'Student'}! 🌟
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Your multi-subject AI companion NOVA is ready to help you learn, practice, and master concepts!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BrutalButton
            variant="lavender"
            onClick={() => navigate('/student/ai-teacher')}
            icon={<Bot className="w-4 h-4" />}
          >
            [ DISCUSS WITH NOVA ]
          </BrutalButton>
          <BrutalButton
            variant="white"
            onClick={() => navigate('/student/profile')}
            icon={<UserCheck className="w-4 h-4" />}
          >
            [ MY PROFILE ]
          </BrutalButton>
        </div>
      </div>

      {/* 4 Core Student KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LEARNING PROGRESS */}
        <BrutalCard size="normal" accent="mint" className="p-5">
          <span className="text-xs font-bold text-slate-600 uppercase">LEARNING_PROGRESS</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {learningProgressPercent}%
          </div>
          <div className="w-full bg-slate-200 h-2 border border-[#0F172A] mt-2">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${learningProgressPercent}%` }}
            />
          </div>
        </BrutalCard>

        {/* LESSONS COMPLETED */}
        <BrutalCard size="normal" accent="lavender" className="p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-600 uppercase">LESSONS_COMPLETED</span>
            <BookOpen className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {lessonsCompletedText}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">
            {progress?.remaining_lessons_count ? `${progress.remaining_lessons_count} REMAINING` : 'CURRICULUM UNITS'}
          </div>
        </BrutalCard>

        {/* AVERAGE SCORE */}
        <BrutalCard size="normal" accent="sky" className="p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-600 uppercase">AVERAGE_SCORE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {recentAttempts.length > 0 ? `${avgScore}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">
            {recentAttempts.length > 0 ? 'CALCULATED FROM ATTEMPTS' : 'NO TESTS YET'}
          </div>
        </BrutalCard>

        {/* CURRENT STREAK */}
        <BrutalCard size="normal" accent="amber" className="p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-600 uppercase">CURRENT_STREAK</span>
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {currentStreak} DAYS
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">
            {currentStreak > 0 ? 'STREAK ACTIVE! 🔥' : 'START PRACTICING TODAY'}
          </div>
        </BrutalCard>
      </div>

      {/* Student Merit Badges Showcase */}
      <div className="p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#0F172A] gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="font-extrabold text-sm text-[#0F172A]">EARNED MERIT BADGES & ACADEMIC HONORS</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#FEFCE8] border border-[#0F172A]">
              {unlockedBadgesCount} / {totalBadgesCount} UNLOCKED
            </span>
          </div>
          <button
            onClick={() => navigate('/student/achievements')}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            [ VIEW MERIT BOARD & ALL BADGES <ArrowRight className="w-3.5 h-3.5" /> ]
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Badge 1: Attendance Badge */}
          <div className="p-3 bg-[#A7F3D0]/30 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#A7F3D0] border-2 border-[#0F172A] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0F172A]">
                <UserCheck className="w-5 h-5 text-emerald-900" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase">ATTENDANCE BADGE</div>
                <div className="text-xs font-extrabold text-[#0F172A]">Committed Attendee</div>
                <div className="text-[10px] text-slate-600">Active portal attendance</div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[10px] font-extrabold text-emerald-950 shrink-0">
              EARNED
            </span>
          </div>

          {/* Badge 2: Test Responsibility Badge */}
          <div className={`p-3 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center justify-between gap-3 ${
            hasTestResponsibility ? 'bg-[#C4B5FD]/30' : 'bg-slate-50 opacity-80 border-dashed'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 border-2 border-[#0F172A] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0F172A] ${
                hasTestResponsibility ? 'bg-[#C4B5FD]' : 'bg-slate-200'
              }`}>
                <ShieldCheck className="w-5 h-5 text-indigo-900" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-indigo-900 uppercase">RESPONSIBILITY BADGE</div>
                <div className="text-xs font-extrabold text-[#0F172A]">Test Responsibility</div>
                <div className="text-[10px] text-slate-600">
                  {hasTestResponsibility ? 'Test attended & submitted' : 'Attend a test to unlock'}
                </div>
              </div>
            </div>
            <span className={`px-2 py-0.5 border border-[#0F172A] text-[10px] font-extrabold shrink-0 ${
              hasTestResponsibility ? 'bg-[#C4B5FD] text-indigo-950' : 'bg-white text-slate-500'
            }`}>
              {hasTestResponsibility ? 'EARNED' : 'ATTEND TEST'}
            </span>
          </div>

          {/* Badge 3: Study Consistency or Next Milestone */}
          <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#FDE68A] border-2 border-[#0F172A] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0F172A]">
                <Star className="w-5 h-5 text-amber-900 fill-amber-500" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-amber-900 uppercase">MERIT RECOGNITION</div>
                <div className="text-xs font-extrabold text-[#0F172A]">Merit Honors</div>
                <div className="text-[10px] text-slate-600">Earn badges & collect PTS</div>
              </div>
            </div>
            <BrutalButton
              variant="white"
              size="sm"
              onClick={() => navigate('/student/achievements')}
              className="text-[10px] py-1 px-2"
            >
              EXPLORE
            </BrutalButton>
          </div>
        </div>
      </div>

      {/* Main Student Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning Card */}
        <BrutalCard size="large" accent="lavender" className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                CONTINUE_LEARNING // RECOMMENDED
              </span>
              <Badge variant="white">
                {recommendedLesson ? (recommendedLesson.difficulty || 'Easy') : 'STANDBY'}
              </Badge>
            </div>

            {recommendedLesson ? (
              <>
                <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-2">
                  {recommendedLesson.title}
                </h3>
                <p className="text-xs text-slate-700 font-sans leading-relaxed mb-4">
                  {recommendedLesson.summary || recommendedLesson.content}
                </p>

                <div className="flex flex-wrap gap-2 text-xs mb-6">
                  {recommendedLesson.grammar_topics && recommendedLesson.grammar_topics.length > 0 && (
                    <span className="px-2 py-1 bg-white border border-[#0F172A] font-bold">
                      Grammar: {recommendedLesson.grammar_topics.join(', ')}
                    </span>
                  )}
                  {recommendedLesson.vocabulary && recommendedLesson.vocabulary.length > 0 && (
                    <span className="px-2 py-1 bg-white border border-[#0F172A] font-bold">
                      Vocabulary: {recommendedLesson.vocabulary.slice(0, 4).join(', ')}
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <BrutalButton
                    variant="mint"
                    onClick={() => navigate(`/student/lessons/${recommendedLesson.id}`)}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    [ CONTINUE LESSON ]
                  </BrutalButton>
                  <BrutalButton
                    variant="white"
                    onClick={() => navigate('/student/practice')}
                    icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                  >
                    PRACTICE TOPICS
                  </BrutalButton>
                </div>
              </>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-[#0F172A] bg-white font-mono">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-extrabold text-[#0F172A] uppercase">NO COMPLETED LESSONS</div>
                <p className="text-xs text-slate-500 mt-1">
                  Please ask your teacher to upload the class textbook to unlock reading passages and lessons.
                </p>
                <div className="mt-4">
                  <BrutalButton
                    variant="mint"
                    size="sm"
                    onClick={() => navigate('/student/ai-teacher')}
                  >
                    CHAT WITH AI TEACHER
                  </BrutalButton>
                </div>
              </div>
            )}
          </div>
        </BrutalCard>

        {/* NOVA AI Companion Assistant Card */}
        <BrutalCard size="large" accent="mint" className="p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0F172A] text-[#A7F3D0] text-xs font-bold mb-3">
              <Bot className="w-3.5 h-3.5" />
              NOVA AI COMPANION // READY TO MENTOR
            </div>
            <h4 className="text-lg font-extrabold text-[#0F172A] font-sans mb-1">
              "Explain it to NOVA in your own words!"
            </h4>
            <p className="text-xs text-slate-600 font-sans leading-relaxed mb-4">
              Learn any topic step-by-step across Science, Maths, and English. Test your understanding with conversational teach-back!
            </p>

            <div className="space-y-1.5 text-xs">
              <div
                onClick={() => navigate('/student/ai-teacher')}
                className="p-2 bg-white border border-[#0F172A] font-bold cursor-pointer hover:bg-[#FEFCE8] truncate"
              >
                🌿 "I want to explain photosynthesis to NOVA"
              </div>
              <div
                onClick={() => navigate('/student/ai-teacher')}
                className="p-2 bg-white border border-[#0F172A] font-bold cursor-pointer hover:bg-[#FEFCE8] truncate"
              >
                📐 "Why do we use fractions in real life?"
              </div>
            </div>
          </div>

          <BrutalButton
            variant="primary"
            onClick={() => navigate('/student/ai-teacher')}
            className="w-full mt-4"
          >
            [ OPEN NOVA COMPANION ]
          </BrutalButton>
        </BrutalCard>
      </div>

      {/* Upcoming Tests & Recent Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPCOMING TESTS */}
        <BrutalCard size="normal" accent="sky" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-xs uppercase text-[#0F172A]">
              UPCOMING_TESTS // CURRICULUM
            </span>
            <Badge variant="mint">PUBLISHED</Badge>
          </div>

          {tests.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-[#0F172A] bg-white font-mono">
              <ClipboardCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <div className="font-extrabold text-xs text-[#0F172A] uppercase">NO TESTS YET</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your teacher hasn't published any tests for your class yet.
              </p>
            </div>
          ) : (
            tests.slice(0, 3).map((t) => {
              const matchingAttempt = attempts.find(
                (a) => a.test_id === t.id || (a.test_id && t.id && a.test_id.replace(/[-_]/g, '') === t.id.replace(/[-_]/g, ''))
              );
              const isCompleted = !!matchingAttempt;

              return (
                <div
                  key={t.id}
                  className={`p-4 border-2 border-[#0F172A] mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#0F172A] ${
                    isCompleted ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-[#0F172A] font-sans">
                        {t.title}
                      </span>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[10px] font-extrabold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-800" /> COMPLETED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-[#BAE6FD] border border-[#0F172A] text-[10px] font-extrabold text-sky-950">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 font-bold block mt-0.5">
                      {t.total_questions || 5} QUESTIONS • {t.duration_minutes || 15} MIN
                      {isCompleted && (
                        <span className="text-emerald-800 font-extrabold ml-1.5">
                          • SCORE: {matchingAttempt.score} / {matchingAttempt.total_questions || t.total_questions || 5} ({matchingAttempt.percentage}%)
                        </span>
                      )}
                    </span>
                  </div>
                  {isCompleted ? (
                    <BrutalButton
                      variant="mint"
                      size="sm"
                      onClick={() => navigate(`/student/results/${matchingAttempt.id}`)}
                    >
                      [ VIEW RESULT & ANSWERS ]
                    </BrutalButton>
                  ) : (
                    <BrutalButton
                      variant="sky"
                      size="sm"
                      onClick={() => navigate(`/student/tests/${t.id}`)}
                    >
                      [ START TEST ]
                    </BrutalButton>
                  )}
                </div>
              );
            })
          )}
        </BrutalCard>

        {/* RECENT RESULTS */}
        <BrutalCard size="normal" accent="amber" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-xs uppercase text-[#0F172A]">
              RECENT_EVALUATION_RESULTS
            </span>
            <span className="text-[10px] font-bold text-slate-500">PAST ATTEMPTS</span>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-[#0F172A] bg-white font-mono">
              <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <div className="font-extrabold text-xs text-[#0F172A] uppercase">NO RECENT RESULTS</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Take your first test to see your evaluated score and weak topic diagnostics.
              </p>
            </div>
          ) : (
            recentAttempts.slice(0, 2).map((att: any) => (
              <div key={att.id} className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] mb-3 shadow-[2px_2px_0px_#0F172A]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-extrabold text-[#0F172A]">
                    {att.test_title || 'Class Assessment'}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700 bg-white px-2 py-0.5 border border-[#0F172A]">
                    {att.score} / {att.total_questions} ({att.percentage}%)
                  </span>
                </div>
                <BrutalButton
                  variant="white"
                  size="sm"
                  onClick={() => navigate(`/student/results/${att.id}`)}
                  className="w-full text-xs"
                >
                  VIEW FULL RESULT BREAKDOWN
                </BrutalButton>
              </div>
            ))
          )}
        </BrutalCard>
      </div>
    </div>
  );
};
