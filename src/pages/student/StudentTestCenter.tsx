import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Test } from '../../types';
import { Clock, ListChecks, ArrowRight, CheckCircle2 } from 'lucide-react';

export const StudentTestCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getTests({ class_id: user.class_id || undefined, published_only: true }),
      api.getStudentAttempts(user.id),
    ])
      .then(([testsData, attemptsData]) => {
        setTests(testsData);
        setAttempts(attemptsData);
      })
      .catch((err) => {
        console.error('Error loading tests:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#BAE6FD] text-[#0F172A] border border-[#0F172A]">
            STUDENT_TEST_CENTER // ACTIVE_ASSESSMENTS
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Official Curriculum Tests
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Take timed tests created and published by your English teacher. Your results will be evaluated automatically.
          </p>
        </div>

        <Badge variant="mint">OFFICIAL // CURRICULUM</Badge>
      </div>

      {tests.length === 0 ? (
        <EmptyState
          label="TEST_CENTER // EMPTY"
          title="No tests yet"
          description="Your teacher hasn't published any tests for your class yet. Check back soon or practice with the AI Teacher!"
          actionText="OPEN AI TEACHER"
          onAction={() => navigate('/student/ai-teacher')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const matchingAttempt = attempts.find(
              (a) => a.test_id === test.id || (a.test_id && test.id && a.test_id.replace(/[-_]/g, '') === test.id.replace(/[-_]/g, ''))
            );
            const isCompleted = !!matchingAttempt;

            return (
              <BrutalCard
                key={test.id}
                size="normal"
                accent={isCompleted ? 'mint' : 'sky'}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                      {isCompleted ? 'COMPLETED' : 'PUBLISHED'}
                    </span>
                    <Badge variant={isCompleted ? 'mint' : 'sky'}>
                      {isCompleted ? 'FINALIZED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-2">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed mb-4">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAFC] border-2 border-[#0F172A] mb-4 text-xs text-center font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-[#0F172A]" />
                      <span>{test.total_questions || 5} QUESTIONS</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 border-l-2 border-slate-200">
                      <Clock className="w-4 h-4 text-[#0F172A]" />
                      <span>{test.duration_minutes || 15} MINUTES</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="p-3 bg-[#A7F3D0]/30 border-2 border-[#0F172A] mb-4 text-xs flex justify-between items-center font-mono">
                      <span className="font-bold text-emerald-900">EVALUATION SCORE:</span>
                      <span className="font-extrabold text-sm text-[#0F172A] bg-white px-2 py-0.5 border border-[#0F172A]">
                        {matchingAttempt.score} / {matchingAttempt.total_questions || test.total_questions || 5} ({matchingAttempt.percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                {isCompleted ? (
                  <BrutalButton
                    variant="mint"
                    onClick={() => navigate(`/student/results/${matchingAttempt.id}`)}
                    className="w-full"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    [ VIEW RESULT & ANSWERS ]
                  </BrutalButton>
                ) : (
                  <BrutalButton
                    variant="primary"
                    onClick={() => navigate(`/student/tests/${test.id}`)}
                    className="w-full"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    [ START TEST ]
                  </BrutalButton>
                )}
              </BrutalCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
