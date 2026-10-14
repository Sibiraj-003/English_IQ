import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Check,
  X,
} from 'lucide-react';

export const StudentTestResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getTestResult(id)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        console.error('Error fetching test result:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading || !result) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_EVALUATION_REPORT...
      </div>
    );
  }

  const score = result.score ?? 0;
  const total = result.answers?.length ?? (result.total_questions || 0);
  const percentage = result.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const correctCount = result.answers?.filter((a: any) => a.is_correct).length ?? score;
  const wrongCount = Math.max(0, total - correctCount);

  // Determine strong & needs practice topics strictly from actual answers
  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  if (result.topic_breakdown && result.topic_breakdown.length > 0) {
    result.topic_breakdown.forEach((tb: any) => {
      if (tb.accuracy >= 70) {
        strongTopics.push(tb.topic);
      } else {
        weakTopics.push(tb.topic);
      }
    });
  }

  return (
    <div className="space-y-6 font-mono w-full">
      {/* Top Banner */}
      <div className="p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
              RESULT // COMPLETE
            </span>
            <Badge variant="mint">AUTO_EVALUATED</Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
            Assessment Evaluation Report
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {result.test_title || 'Assessment'}
          </p>
        </div>

        <BrutalButton
          variant="mint"
          size="sm"
          onClick={() => navigate('/student/practice')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          [ PRACTICE WEAK TOPICS ]
        </BrutalButton>
      </div>

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BrutalCard size="normal" accent="lavender" className="p-5 text-center">
          <div className="text-xs font-bold text-slate-600 uppercase">SCORE</div>
          <div className="text-3xl font-extrabold text-[#0F172A] font-sans mt-1">
            {score} / {total}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">TOTAL MARKS</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="mint" className="p-5 text-center">
          <div className="text-xs font-bold text-slate-600 uppercase">PERCENTAGE</div>
          <div className="text-3xl font-extrabold text-emerald-700 font-sans mt-1">
            {percentage}%
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            {percentage >= 80 ? 'EXCELLENT' : percentage >= 60 ? 'GOOD' : 'NEEDS PRACTICE'}
          </div>
        </BrutalCard>

        <BrutalCard size="normal" accent="sky" className="p-5 text-center">
          <div className="text-xs font-bold text-slate-600 uppercase">CORRECT</div>
          <div className="text-3xl font-extrabold text-emerald-600 font-sans mt-1 flex items-center justify-center gap-1">
            <Check className="w-6 h-6 stroke-[3]" />
            {correctCount}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">VERIFIED ANSWERS</div>
        </BrutalCard>

        <BrutalCard size="normal" accent="pink" className="p-5 text-center">
          <div className="text-xs font-bold text-slate-600 uppercase">WRONG</div>
          <div className="text-3xl font-extrabold text-rose-600 font-sans mt-1 flex items-center justify-center gap-1">
            <X className="w-6 h-6 stroke-[3]" />
            {wrongCount}
          </div>
          <div className="text-[10px] text-rose-700 font-bold mt-1">LEARNING OPPORTUNITY</div>
        </BrutalCard>
      </div>

      {/* Diagnostics: Strong Topics vs Needs Practice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics */}
        <BrutalCard size="normal" accent="mint" className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-[#0F172A] mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-[#0F172A] uppercase">
              Strong Topics
            </h4>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            You showed high accuracy and strong recall in these areas:
          </p>
          <div className="space-y-2">
            {strongTopics.length > 0 ? (
              strongTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#A7F3D0] border-2 border-[#0F172A] font-bold text-xs flex justify-between items-center shadow-[1.5px_1.5px_0px_#0F172A]"
                >
                  <span>{topic}</span>
                  <span className="text-[10px] uppercase font-extrabold bg-[#0F172A] text-white px-1.5 py-0.2">
                    MASTERED
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-100 border border-[#0F172A] text-xs text-slate-600 italic">
                Complete more evaluations to detect strong topics.
              </div>
            )}
          </div>
        </BrutalCard>

        {/* Needs Practice */}
        <BrutalCard size="normal" accent="amber" className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-[#0F172A] mb-3">
            <XCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-sm text-[#0F172A] uppercase">
              Needs Practice
            </h4>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Focus on these areas to reach 100% curriculum mastery:
          </p>
          <div className="space-y-2">
            {weakTopics.length > 0 ? (
              weakTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#FDE68A] border-2 border-[#0F172A] font-bold text-xs flex justify-between items-center shadow-[1.5px_1.5px_0px_#0F172A]"
                >
                  <span>{topic}</span>
                  <span className="text-[10px] uppercase font-extrabold bg-amber-800 text-white px-1.5 py-0.2">
                    RECOMMENDED FOCUS
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-600 text-xs text-emerald-800 font-bold">
                No weak topics detected. Great performance!
              </div>
            )}
          </div>
        </BrutalCard>
      </div>

      {/* AI Recommendation Banner */}
      {weakTopics.length > 0 && (
        <BrutalCard size="large" accent="lavender" className="p-6 bg-[#FEFCE8]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0F172A] text-[#FDE68A] text-xs font-bold mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                AI_COACH // RECOMMENDATION
              </div>
              <h4 className="text-lg font-extrabold text-[#0F172A] font-sans">
                "Let's practice {weakTopics[0]}!"
              </h4>
              <p className="text-xs text-slate-700 font-sans mt-1">
                Targeted exercises are available to help you master {weakTopics[0]}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <BrutalButton
                variant="mint"
                onClick={() => navigate('/student/practice')}
                icon={<Sparkles className="w-4 h-4" />}
              >
                [ PRACTICE WEAK TOPICS ]
              </BrutalButton>
              <BrutalButton
                variant="white"
                onClick={() => navigate('/student/lessons')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                [ REVIEW LESSONS ]
              </BrutalButton>
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Detailed Question Review List */}
      {result.answers && result.answers.length > 0 && (
        <BrutalCard size="large" className="p-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
            <div>
              <h4 className="font-extrabold text-sm text-[#0F172A] uppercase">
                Questions & Written Answers Review ({result.answers.length} Questions)
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Review your submitted answers alongside verified correct answers and pedagogical feedback.
              </p>
            </div>
            <Badge variant="lavender">SUBMISSION_RECORD</Badge>
          </div>

          <div className="space-y-4">
            {result.answers.map((ans: any, idx: number) => {
              const questionTitle = ans.question || ans.question_text || `Question ${idx + 1}`;
              const options: string[] = ans.options || [];

              return (
                <div
                  key={idx}
                  className={`p-5 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] ${
                    ans.is_correct ? 'bg-[#F0FDF4]' : 'bg-[#FFF1F2]'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-[#0F172A]/20 mb-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#0F172A] text-white text-xs font-extrabold uppercase">
                        QUESTION {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 border border-[#0F172A]">
                        TOPIC: {ans.topic || 'General'}
                      </span>
                    </div>

                    <div>
                      {ans.is_correct ? (
                        <span className="text-emerald-950 bg-emerald-200 px-2.5 py-0.5 border border-emerald-900 text-xs font-extrabold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-800" />
                          CORRECT (+1 Mark)
                        </span>
                      ) : (
                        <span className="text-rose-950 bg-rose-200 px-2.5 py-0.5 border border-rose-900 text-xs font-extrabold flex items-center gap-1">
                          <X className="w-3.5 h-3.5 stroke-[3] text-rose-800" />
                          INCORRECT (0 Marks)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <h5 className="text-sm font-extrabold text-[#0F172A] font-sans mb-3 leading-snug">
                    {questionTitle}
                  </h5>

                  {/* Multiple Choice Options Grid (if available) */}
                  {options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 font-mono text-xs">
                      {options.map((opt: string, optIdx: number) => {
                        const isStudentAnswer = ans.answer?.trim().toLowerCase() === opt.trim().toLowerCase();
                        const isCorrectAnswer = ans.correct_answer?.trim().toLowerCase() === opt.trim().toLowerCase();

                        let optClasses = 'bg-white border-slate-300 text-slate-700';
                        if (isCorrectAnswer) {
                          optClasses = 'bg-emerald-100 border-2 border-emerald-700 text-emerald-950 font-extrabold shadow-[1px_1px_0px_#0F172A]';
                        } else if (isStudentAnswer && !ans.is_correct) {
                          optClasses = 'bg-rose-100 border-2 border-rose-700 text-rose-950 font-bold';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 border flex items-center justify-between gap-2 ${optClasses}`}
                          >
                            <span>{opt}</span>
                            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase shrink-0">
                              {isCorrectAnswer && (
                                <span className="bg-emerald-700 text-white px-1.5 py-0.2">
                                  ✓ CORRECT ANSWER
                                </span>
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <span className="bg-rose-700 text-white px-1.5 py-0.2">
                                  YOUR ANSWER
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Written Answer Comparison Card */}
                  <div className="p-3 bg-white border-2 border-[#0F172A] text-xs font-mono space-y-1 mb-2.5 shadow-[1.5px_1.5px_0px_#0F172A]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600">Your Submitted Answer:</span>
                      <strong className={ans.is_correct ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                        {ans.answer || '(unanswered)'}
                      </strong>
                    </div>
                    {ans.correct_answer && !ans.is_correct && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">Verified Correct Answer:</span>
                        <strong className="text-emerald-700 font-extrabold">
                          {ans.correct_answer}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Explanation & Pedagogical Feedback */}
                  {(ans.explanation || ans.feedback) && (
                    <div className="p-3 bg-[#FEFCE8] border border-[#0F172A] text-xs font-mono text-slate-700">
                      <strong className="text-amber-900 uppercase block mb-0.5">EXPLANATION // FEEDBACK:</strong>
                      <span>{ans.explanation || ans.feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </BrutalCard>
      )}
    </div>
  );
};
