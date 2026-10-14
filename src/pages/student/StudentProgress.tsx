import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StudentProgressData } from '../../types';
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
import { TrendingUp, Award, BookOpen, CheckCircle, Sparkles } from 'lucide-react';

export const StudentProgress: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getStudentProgress(user.id)
      .then((data) => {
        setProgress(data);
      })
      .catch((err) => {
        console.error('Error loading progress:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading || !progress) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_STUDENT_ANALYTICS...
      </div>
    );
  }

  const hasScoreTrends = progress.score_trends && progress.score_trends.length > 0;
  const hasTopicMastery = progress.topic_mastery && progress.topic_mastery.length > 0;
  const hasWeakTopics = progress.weak_topics && progress.weak_topics.length > 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
            STUDENT_PROGRESS // ACADEMIC_TRACKER
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Learning Progress & Topic Mastery
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time tracking of curriculum completion, score trends, and topic accuracy.
          </p>
        </div>

        <BrutalButton
          variant="mint"
          size="sm"
          onClick={() => navigate('/student/practice')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          PRACTICE WEAK TOPICS
        </BrutalButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BrutalCard size="normal" accent="lavender" className="p-5">
          <div className="text-xs font-bold text-slate-600 uppercase">OVERALL PROGRESS</div>
          <div className="text-3xl font-extrabold text-[#0F172A] font-sans mt-1">
            {progress.learning_progress_percent}%
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">CURRICULUM TARGET: 100%</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="mint" className="p-5">
          <div className="text-xs font-bold text-slate-600 uppercase">LESSONS COMPLETED</div>
          <div className="text-3xl font-extrabold text-[#0F172A] font-sans mt-1">
            {progress.lessons_completed}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">READING UNITS</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="sky" className="p-5">
          <div className="text-xs font-bold text-slate-600 uppercase">AVERAGE ACCURACY</div>
          <div className="text-3xl font-extrabold text-emerald-700 font-sans mt-1">
            {hasScoreTrends ? `${progress.average_score}%` : '0%'}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            {hasScoreTrends ? 'BASED ON ATTEMPTS' : 'NO TESTS COMPLETED'}
          </div>
        </BrutalCard>

        <BrutalCard size="normal" accent="amber" className="p-5">
          <div className="text-xs font-bold text-slate-600 uppercase">LEARNING STREAK</div>
          <div className="text-3xl font-extrabold text-amber-800 font-sans mt-1">
            {progress.current_streak_days} DAYS
          </div>
          <div className="text-[10px] text-amber-800 font-bold mt-1">
            {progress.current_streak_days > 0 ? 'DAILY PRACTICE 🔥' : 'START TODAY'}
          </div>
        </BrutalCard>
      </div>

      {/* Charts Section */}
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
                <LineChart data={progress.score_trends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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

        {/* Grammar Accuracy Bar Chart */}
        <BrutalCard size="large" className="p-6">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="font-extrabold text-sm text-[#0F172A] uppercase">
              GRAMMAR_TOPIC_ACCURACY (%)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FDE68A] border border-[#0F172A]">
              DIAGNOSTICS
            </span>
          </div>

          {hasTopicMastery ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress.topic_mastery} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                Take tests and answer questions to see grammar topic accuracy.
              </p>
            </div>
          )}
        </BrutalCard>
      </div>

      {/* Weak Topics & Personalized Action Plan */}
      <BrutalCard size="large" accent="amber" className="p-6">
        <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
          <span className="font-extrabold text-sm text-[#0F172A] uppercase">
            TARGETED_TOPIC_RECOMMENDATIONS // ACTION_PLAN
          </span>
          <Badge variant="amber">AI_DIAGNOSTICS</Badge>
        </div>

        {hasWeakTopics ? (
          <div className="space-y-3">
            {progress.weak_topics.map((wt: any) => (
              <div
                key={wt.id}
                className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold px-1.5 py-0.2 bg-rose-600 text-white uppercase">
                      {wt.topic}
                    </span>
                    <span className="text-xs font-bold text-rose-800">
                      ACCURACY: {wt.accuracy}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-sans">{wt.recommended_action}</p>
                </div>

                <BrutalButton
                  variant="mint"
                  size="sm"
                  onClick={() => navigate('/student/practice')}
                >
                  PRACTICE NOW
                </BrutalButton>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center border-2 border-dashed border-[#0F172A] bg-white">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="font-extrabold text-sm text-[#0F172A] uppercase">
              NO WEAK TOPICS DETECTED
            </div>
            <p className="text-xs text-slate-600 mt-1">
              You are maintaining great accuracy across all evaluated topics!
            </p>
          </div>
        )}
      </BrutalCard>
    </div>
  );
};
