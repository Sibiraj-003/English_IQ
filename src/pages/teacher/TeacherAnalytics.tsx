import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { api } from '../../services/api';
import { SchoolClass, ClassAnalyticsData } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, AlertTriangle, Users, Award, TrendingUp, CheckCircle, GraduationCap, Trophy, Eye, Medal, Check } from 'lucide-react';

export const TeacherAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [analytics, setAnalytics] = useState<ClassAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClasses().then((clsList) => {
      setClasses(clsList);
      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    api.getClassAnalytics(selectedClassId).then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [selectedClassId]);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_ANALYTICS_DATA...
      </div>
    );
  }

  const COLORS = ['#A7F3D0', '#BAE6FD', '#FDE68A', '#FBCFE8'];
  const hasEvaluationData = analytics.tests_completed > 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner with Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
            CLASS_ANALYTICS // EVALUATION_METRICS
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            {analytics.class_name} Performance Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Aggregated test submissions, curriculum mastery distribution, and AI weak topic diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F8FAFC] border-2 border-[#0F172A] px-3 py-1.5 shadow-[2px_2px_0px_#0F172A]">
            <GraduationCap className="w-4 h-4 text-[#0F172A]" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent font-bold text-xs text-[#0F172A] focus:outline-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.students_count ?? 0} students)
                </option>
              ))}
            </select>
          </div>
          <Badge variant="mint">AUTO_EVALUATED</Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Average */}
        <BrutalCard size="normal" accent="mint" className="p-5">
          <span className="text-xs font-bold text-slate-600 uppercase">CLASS AVERAGE SCORE</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {hasEvaluationData ? `${analytics.average_score}%` : '0%'}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {hasEvaluationData ? 'Live evaluated' : 'No student attempts'}
          </div>
        </BrutalCard>

        {/* Tests Completed */}
        <BrutalCard size="normal" accent="sky" className="p-5">
          <span className="text-xs font-bold text-slate-600 uppercase">TESTS EVALUATED</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">
            {analytics.tests_completed}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Across {analytics.active_students} enrolled student{analytics.active_students === 1 ? '' : 's'}
          </div>
        </BrutalCard>

        {/* Weakest Topic Alert */}
        <BrutalCard size="normal" accent="amber" className="p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase">WEAKEST TOPIC</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1 font-sans">
            {analytics.weakest_topic ? `${analytics.weakest_topic.topic} (${analytics.weakest_topic.accuracy}%)` : 'NONE'}
          </div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">
            Recommendation: {analytics.weakest_topic?.recommendation || 'No weak topics detected.'}
          </div>
        </BrutalCard>
      </div>

      {!hasEvaluationData ? (
        <EmptyState
          label="ANALYTICS // EMPTY"
          title="NO EVALUATION DATA AVAILABLE"
          description="Students have not submitted any test attempts for this class yet. Evaluation data and topic analytics will appear here after students complete tests."
        />
      ) : (
        <>
          {/* Student Rank Leaderboard & Scored Marks Table */}
          <BrutalCard size="large" className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FEF08A] text-[#0F172A] border border-[#0F172A] flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-700" />
                    STUDENT_EVALUATIONS // MERIT_RANKS
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    RANKED BY SCORE
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
                  Student Examination Performance Leaderboard
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ranked list of enrolled students based on scored marks, accuracy percentages, and evaluation results.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-1 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                  {analytics.student_rankings?.length || 0} RANKED SUBMISSION{(analytics.student_rankings?.length || 0) === 1 ? '' : 'S'}
                </span>
              </div>
            </div>

            {(!analytics.student_rankings || analytics.student_rankings.length === 0) ? (
              <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC]">
                <Trophy className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-extrabold text-sm text-[#0F172A] uppercase">NO RANKINGS YET</div>
                <p className="text-xs text-slate-500 mt-1">
                  Student rankings will appear automatically once students submit assessments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border-2 border-[#0F172A] text-xs font-mono shadow-[3px_3px_0px_#0F172A]">
                  <thead>
                    <tr className="bg-[#0F172A] text-white uppercase text-[11px] font-extrabold">
                      <th className="p-3 border-r border-slate-700 w-24 text-center">RANK</th>
                      <th className="p-3 border-r border-slate-700">STUDENT NAME & ID</th>
                      <th className="p-3 border-r border-slate-700">ASSESSMENT</th>
                      <th className="p-3 border-r border-slate-700">SCORED MARKS</th>
                      <th className="p-3 border-r border-slate-700 text-center">GRADE</th>
                      <th className="p-3 border-r border-slate-700 text-center">STATUS</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#0F172A]">
                    {analytics.student_rankings.map((st) => {
                      const isTopRank = st.rank === 1;
                      const isSecond = st.rank === 2;
                      const isThird = st.rank === 3;

                      let rankBadgeClass = 'bg-slate-100 text-slate-800 border-slate-400';
                      let rankLabel = `#${st.rank}`;
                      if (isTopRank) {
                        rankBadgeClass = 'bg-[#FEF08A] text-amber-950 border-amber-800 shadow-[1px_1px_0px_#0F172A] font-extrabold';
                        rankLabel = '🥇 RANK #1';
                      } else if (isSecond) {
                        rankBadgeClass = 'bg-[#E2E8F0] text-slate-900 border-slate-600 font-extrabold';
                        rankLabel = '🥈 RANK #2';
                      } else if (isThird) {
                        rankBadgeClass = 'bg-[#FFEDD5] text-orange-950 border-orange-700 font-extrabold';
                        rankLabel = '🥉 RANK #3';
                      } else {
                        rankLabel = `RANK #${st.rank}`;
                      }

                      return (
                        <tr
                          key={st.attempt_id}
                          className={`hover:bg-[#FEFCE8] transition-colors ${
                            isTopRank ? 'bg-[#F0FDF4]/50' : 'bg-white'
                          }`}
                        >
                          {/* Rank Column */}
                          <td className="p-3 border-r-2 border-[#0F172A] text-center font-extrabold">
                            <span className={`inline-block px-2 py-1 border text-xs whitespace-nowrap ${rankBadgeClass}`}>
                              {rankLabel}
                            </span>
                          </td>

                          {/* Student Name & ID */}
                          <td className="p-3 border-r-2 border-[#0F172A]">
                            <div className="font-sans font-extrabold text-sm text-[#0F172A]">
                              {st.student_name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F1F5F9] border border-[#0F172A] text-slate-700">
                                ID: {st.student_id_number}
                              </span>
                            </div>
                          </td>

                          {/* Assessment Title */}
                          <td className="p-3 border-r-2 border-[#0F172A]">
                            <div className="font-extrabold text-[#0F172A]">
                              {st.test_title}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">
                              {analytics.class_name} • Unit Test
                            </div>
                          </td>

                          {/* Scored Marks & Percentage */}
                          <td className="p-3 border-r-2 border-[#0F172A]">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold font-sans text-[#0F172A]">
                                {st.score} / {st.total_marks}
                              </span>
                              <span className="text-xs font-bold text-slate-500">Marks</span>
                              <span className={`text-xs font-extrabold ml-1 px-1.5 py-0.2 border border-[#0F172A] ${
                                st.percentage >= 60 ? 'bg-[#A7F3D0] text-emerald-950' : 'bg-[#FDE68A] text-amber-950'
                              }`}>
                                {st.percentage}%
                              </span>
                            </div>
                            <div className="w-36 bg-slate-200 h-1.5 border border-[#0F172A] mt-1.5">
                              <div
                                className={`h-full ${st.percentage >= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, st.percentage)}%` }}
                              />
                            </div>
                          </td>

                          {/* Grade */}
                          <td className="p-3 border-r-2 border-[#0F172A] text-center font-extrabold">
                            <span className="inline-block w-7 h-7 leading-7 bg-[#C4B5FD] border border-[#0F172A] text-[#0F172A] text-xs font-sans font-extrabold shadow-[1px_1px_0px_#0F172A]">
                              {st.grade}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3 border-r-2 border-[#0F172A] text-center font-bold">
                            <Badge variant={st.percentage >= 60 ? 'mint' : 'amber'}>
                              {st.status}
                            </Badge>
                          </td>

                          {/* Action */}
                          <td className="p-3 text-right">
                            <BrutalButton
                              variant="white"
                              size="sm"
                              onClick={() => navigate(`/student/results/${st.attempt_id}`)}
                              className="text-[10px] py-1 px-2.5 font-bold"
                              icon={<Eye className="w-3 h-3 text-slate-700" />}
                            >
                              VIEW ATTEMPT
                            </BrutalButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </BrutalCard>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Performance Bar Chart */}
            <BrutalCard size="large" className="p-6">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
                <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                  TOPIC_MASTERY_ACCURACY (%)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
                  CURRICULUM_UNITS
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.topic_performance}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
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
                    <Bar dataKey="accuracy" fill="#C4B5FD" stroke="#0F172A" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BrutalCard>

            {/* Score Distribution */}
            <BrutalCard size="large" className="p-6">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
                <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                  STUDENT_SCORE_DISTRIBUTION
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#BAE6FD] border border-[#0F172A]">
                  POPULATION
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.score_distribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="range"
                      label={({ range, count }) => `${range} (${count})`}
                      labelLine={false}
                    >
                      {analytics.score_distribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#0F172A"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #0F172A',
                        boxShadow: '3px 3px 0px #0F172A',
                        fontWeight: 'bold',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </BrutalCard>
          </div>

          {/* Most Difficult Questions Breakdown */}
          {analytics.most_difficult_questions && analytics.most_difficult_questions.length > 0 && (
            <BrutalCard size="large" accent="amber" className="p-6">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
                <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                  MOST_DIFFICULT_CURRICULUM_QUESTIONS // DIAGNOSTICS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                  REVISION_NEEDED
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {analytics.most_difficult_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-extrabold text-[#0F172A] font-sans text-sm">
                        "{q.question}"
                      </span>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        TOPIC: {q.topic} • {analytics.class_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-rose-700">
                        {q.failure_rate} Error Rate
                      </span>
                      <Badge variant="amber">RECOMMENDED REVISION</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </BrutalCard>
          )}
        </>
      )}
    </div>
  );
};
