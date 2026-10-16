import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StudentProgressData, StudentLearningProfile, LearningBadge } from '../../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  Sparkles,
  Brain,
  Clock,
  Target,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const StudentProgress: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [learningProfile, setLearningProfile] = useState<StudentLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const studentId = user.id || 'stu-primary-001';

    Promise.all([
      api.getStudentProgress(studentId).catch(() => null),
      api.getStudentLearningProfile(studentId).catch(() => null),
    ])
      .then(([progData, profileData]) => {
        if (progData) setProgress(progData);
        if (profileData) setLearningProfile(profileData);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_STUDENT_ANALYTICS...
      </div>
    );
  }

  const formatStudyTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const hasScoreTrends = progress?.score_trends && progress.score_trends.length > 0;
  const hasTopicMastery = progress?.topic_mastery && progress.topic_mastery.length > 0;
  const hasWeakTopics = progress?.weak_topics && progress.weak_topics.length > 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
            NOVA // STUDENT_LEARNING_PROFILE
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Learning Progress & Concept Mastery
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Cloud-first AI analytics separating Rote Recall from Conceptual Understanding with teach-back evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BrutalButton
            variant="mint"
            size="sm"
            onClick={() => navigate('/student/ai-teacher')}
            icon={<Brain className="w-4 h-4" />}
          >
            DISCUSS WITH NOVA
          </BrutalButton>
          <BrutalButton
            variant="white"
            size="sm"
            onClick={() => navigate('/student/practice')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            PRACTICE TOPICS
          </BrutalButton>
        </div>
      </div>

      {/* Primary KPI Row: Recall vs Understanding + Active Study Time */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BrutalCard size="normal" accent="sky" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">RECALL &amp; MEMORY</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-white border border-[#0F172A]">0-100%</span>
          </div>
          <div className="text-3xl font-extrabold text-sky-950 font-sans mt-1">
            {learningProfile?.overall_recall_average ?? 88}%
          </div>
          <div className="text-[10px] text-slate-600 font-bold mt-1">DEFINITION &amp; FACT RETENTION</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="mint" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">CONCEPT UNDERSTANDING</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-white border border-[#0F172A]">APPLIED</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-950 font-sans mt-1">
            {learningProfile?.overall_understanding_average ?? 78}%
          </div>
          <div className="text-[10px] text-emerald-800 font-bold mt-1">EVALUATED BY TEACH-BACK ENGINE</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="lavender" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">ACTIVE STUDY TIME</span>
            <Clock className="w-4 h-4 text-indigo-900" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A] font-sans mt-1">
            {formatStudyTime(learningProfile?.total_study_seconds ?? 15120)}
          </div>
          <div className="text-[10px] text-indigo-900 font-bold mt-1">ACTIVE CURRICULUM SESSIONS</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="amber" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">LEARNING STREAK</span>
            <span className="text-sm">🔥</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-950 font-sans mt-1">
            {progress?.current_streak_days ?? 4} DAYS
          </div>
          <div className="text-[10px] text-amber-900 font-bold mt-1">CONTINUOUS ENGAGEMENT</div>
        </BrutalCard>
      </div>

      {/* Subject-Wise Profile Breakdown (Recall vs Understanding) */}
      {learningProfile && learningProfile.subjects_profile.length > 0 && (
        <BrutalCard size="large" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 gap-2">
            <div>
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
                MULTI-SUBJECT PROFILE
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mt-1">
                Subject Mastery &amp; Cognitive Depth
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Detailed comparison of memory recall vs conceptual reasoning across all academic subjects.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#FEFCE8] border border-[#0F172A]">
              CLASS: {learningProfile.class_name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningProfile.subjects_profile.map((subj) => {
              const gap = subj.recall_score - subj.understanding_score;
              return (
                <div
                  key={subj.subject_id}
                  className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-[#0F172A]">{subj.subject_name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] border border-[#0F172A]">
                        {formatStudyTime(subj.study_seconds)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-[11px] mb-0.5">
                          <span className="text-slate-600">Recall / Memory</span>
                          <span className="text-sky-900 font-extrabold">{subj.recall_score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 border border-[#0F172A]">
                          <div
                            className="bg-sky-400 h-full"
                            style={{ width: `${subj.recall_score}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-[11px] mb-0.5">
                          <span className="text-slate-600">Understanding</span>
                          <span className="text-emerald-900 font-extrabold">{subj.understanding_score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 border border-[#0F172A]">
                          <div
                            className="bg-emerald-400 h-full"
                            style={{ width: `${subj.understanding_score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {gap >= 15 ? (
                      <div className="p-2 bg-[#FEFCE8] border border-[#0F172A] text-[10px] font-bold text-amber-900 mb-2">
                        💡 Recall is strong. Practice applying concepts in your own words.
                      </div>
                    ) : (
                      <div className="p-2 bg-[#F0FDF4] border border-[#0F172A] text-[10px] font-bold text-emerald-900 mb-2">
                        ✨ Well-balanced recall and conceptual understanding.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[10px] flex items-center justify-between">
                    <span className="font-bold text-slate-500">
                      Weak: {subj.weak_topics.join(', ') || 'None'}
                    </span>
                    <button
                      onClick={() => navigate('/student/ai-teacher')}
                      className="font-extrabold text-[#0F172A] underline hover:bg-[#FDE68A] px-1"
                    >
                      TEACH NOVA &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </BrutalCard>
      )}

      {/* NOVA AI Recommendations */}
      {learningProfile && learningProfile.recommendations.length > 0 && (
        <BrutalCard size="large" accent="amber" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-sm text-[#0F172A] uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-900" />
              NOVA_PERSONALIZED_NEXT_LEARNING_STEPS
            </span>
            <Badge variant="amber">AI_ORCHESTRATED</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {learningProfile.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] border border-[#0F172A] uppercase">
                      {rec.subject_name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">~{rec.estimated_minutes} mins</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0F172A] mb-1">{rec.topic}</h4>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed">{rec.text}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200">
                  <BrutalButton
                    variant="mint"
                    size="sm"
                    className="w-full text-[10px] py-1"
                    onClick={() => navigate('/student/ai-teacher')}
                  >
                    START THIS ACTIVITY &rarr;
                  </BrutalButton>
                </div>
              </div>
            ))}
          </div>
        </BrutalCard>
      )}

      {/* AI Learning Badges with Evidence Checklists */}
      {learningProfile && learningProfile.badges.length > 0 && (
        <BrutalCard size="large" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <div>
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                MEASURABLE_ACHIEVEMENTS
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mt-1">
                AI Learning Badges Earned
              </h3>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              {learningProfile.badges.length} BADGES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningProfile.badges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex gap-3.5"
              >
                <div className="w-12 h-12 bg-[#FEF08A] border-2 border-[#0F172A] flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_#0F172A]">
                  {badge.icon || '🏅'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-[#0F172A]">{badge.badge_name}</h4>
                    <span className="text-[9px] font-bold text-slate-500">
                      {new Date(badge.earned_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{badge.description}</p>

                  {/* Evidence Checklist */}
                  <div className="mt-2.5 p-2 bg-[#F8FAFC] border border-[#0F172A] space-y-1 text-[10px]">
                    <span className="font-extrabold text-[#0F172A] uppercase block">CRITERIA MET // EVIDENCE:</span>
                    {badge.criteria_met.map((criterion, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{criterion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BrutalCard>
      )}

      {/* Historical Test Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Line Chart */}
        <BrutalCard size="large" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-sm text-[#0F172A] uppercase">
              TEST_SCORE_TREND
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C4B5FD] border border-[#0F172A]">
              EVALUATION
            </span>
          </div>

          {hasScoreTrends ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress!.score_trends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #0F172A',
                      boxShadow: '3px 3px 0px #0F172A',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0F172A"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#A7F3D0', stroke: '#0F172A', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC]">
              <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
              <div className="font-extrabold text-sm text-[#0F172A] uppercase">NO TEST HISTORY YET</div>
              <p className="text-xs text-slate-500 mt-1">
                Complete tests to see your performance trend over time.
              </p>
            </div>
          )}
        </BrutalCard>

        {/* Topic Accuracy Bar Chart */}
        <BrutalCard size="large" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-sm text-[#0F172A] uppercase">
              TOPIC_ACCURACY (%)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FDE68A] border border-[#0F172A]">
              DIAGNOSTICS
            </span>
          </div>

          {hasTopicMastery ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress!.topic_mastery} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="topic" tick={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #0F172A',
                      boxShadow: '3px 3px 0px #0F172A',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="accuracy" fill="#BAE6FD" stroke="#0F172A" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC]">
              <BookOpen className="w-8 h-8 text-slate-400 mb-2" />
              <div className="font-extrabold text-sm text-[#0F172A] uppercase">NO TOPIC EVALUATIONS YET</div>
              <p className="text-xs text-slate-500 mt-1">
                Take tests and answer questions to see topic accuracy.
              </p>
            </div>
          )}
        </BrutalCard>
      </div>
    </div>
  );
};

