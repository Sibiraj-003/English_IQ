import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Test, Question } from '../../types';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export const StudentTestRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<any | null>(null);

  const loadTest = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Check if student has already completed this test
      const attempts = await api.getStudentAttempts(user?.id);
      const existing = attempts.find(
        (a) => a.test_id === id || (a.test_id && id && a.test_id.replace(/[-_]/g, '') === id.replace(/[-_]/g, ''))
      );
      if (existing) {
        setCompletedAttempt(existing);
        setLoading(false);
        return;
      }

      const data = await api.getTest(id);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('Test questions are being initialized. Please click retry below.');
      }
      setTest(data);
      setTimeLeft((data.duration_minutes || 15) * 60);
    } catch (err: any) {
      console.error('Error loading test:', err);
      setError(err.message || 'Unable to prepare test environment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitting || error || completedAttempt) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting, error]);

  const questions: Question[] = test?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (!currentQ) return;
    setAnswers({
      ...answers,
      [currentQ.id]: opt,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payloadAnswers = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
      }));

      const timeTaken = (test.duration_minutes || 15) * 60 - timeLeft;

      const evalResult = await api.submitTest(test.id, {
        student_id: user?.id || '',
        time_taken: Math.max(10, timeTaken),
        answers: payloadAnswers,
      });

      navigate(`/student/results/${evalResult.attempt_id}`);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600 space-y-3">
        <div className="inline-block animate-spin w-6 h-6 border-4 border-[#0F172A] border-t-transparent rounded-full mb-2"></div>
        <div>PREPARING_EXAM_ENVIRONMENT...</div>
        <p className="text-xs text-slate-500">Loading curriculum questions and security parameters</p>
      </div>
    );
  }

  if (completedAttempt) {
    return (
      <div className="p-8 max-w-xl mx-auto font-mono">
        <BrutalCard size="large" accent="mint" className="p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-[#A7F3D0] border-2 border-[#0F172A] mx-auto flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
            <CheckCircle className="w-9 h-9 text-emerald-800" />
          </div>

          <div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-[#0F172A] text-[#A7F3D0] uppercase border border-[#0F172A]">
              TEST_ALREADY_COMPLETED // NOT RE-WRITABLE
            </span>
            <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-3">
              Assessment Already Completed
            </h3>
            <p className="text-xs text-slate-600 font-sans mt-2 max-w-md mx-auto leading-relaxed">
              You have already finished and submitted this examination. In accordance with curriculum policy, completed tests cannot be written again.
            </p>
          </div>

          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] inline-block font-mono text-xs">
            <span className="text-slate-500 font-bold uppercase block mb-1">EVALUATED SCORE</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-sans">
              {completedAttempt.score} Marks ({completedAttempt.percentage}%)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <BrutalButton
              variant="mint"
              onClick={() => navigate(`/student/results/${completedAttempt.id}`)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              [ VIEW RESULTS & WRITTEN ANSWERS ]
            </BrutalButton>
            <BrutalButton
              variant="white"
              onClick={() => navigate('/student/tests')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              [ BACK TO TESTS ]
            </BrutalButton>
          </div>
        </BrutalCard>
      </div>
    );
  }

  if (error || !test || questions.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto font-mono">
        <BrutalCard size="normal" accent="pink" className="p-6 text-center space-y-4">
          <div className="flex justify-center text-rose-600">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">EXAM ENVIRONMENT NOTICE</h2>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">
            {error || 'The requested assessment could not be compiled. Please check connection and retry.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <BrutalButton variant="primary" onClick={loadTest}>
              [ RETRY EXAM LOAD ]
            </BrutalButton>
            <BrutalButton variant="white" onClick={() => navigate('/student/tests')}>
              [ RETURN TO TESTS ]
            </BrutalButton>
          </div>
        </BrutalCard>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 120;

  return (
    <div className="space-y-6 font-mono w-full">
      {/* Top Test Banner with Timer & Progress */}
      <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
            TEST_RUNNER // LIVE_SESSION
          </span>
          <h2 className="text-base font-extrabold text-[#0F172A] font-sans mt-0.5">
            {test.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="text-xs font-bold text-slate-600">
            COMPLETED: <span className="text-[#0F172A]">{answeredCount} / {questions.length}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`px-3 py-1 border-2 border-[#0F172A] font-extrabold text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#0F172A] ${
              isTimeCritical ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-[#FEFCE8] text-[#0F172A]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
        <div
          className="bg-[#C4B5FD] h-full transition-all duration-200"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card (Requirement 33) */}
      <BrutalCard size="large" accent="lavender" className="p-6 sm:p-8">
        <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-6">
          <span className="text-xs font-extrabold px-2.5 py-1 bg-[#0F172A] text-white">
            QUESTION {currentIdx + 1} / {questions.length}
          </span>
          <Badge variant="white">TOPIC: {currentQ.topic}</Badge>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-sans leading-snug mb-8">
          {currentQ.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQ.options?.map((opt, idx) => {
            const isSelected = answers[currentQ.id] === opt;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-4 border-2 border-[#0F172A] text-left text-sm font-bold transition-all shadow-[2px_2px_0px_#0F172A] flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[3px_3px_0px_#0F172A] translate-x-1'
                    : 'bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 border-2 border-[#0F172A] bg-white flex items-center justify-center font-extrabold text-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-sans text-base">{opt}</span>
                </div>
                {isSelected && (
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white">
                    SELECTED
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation & Submission Controls (Requirement 33) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-[#0F172A]">
          <BrutalButton
            variant="white"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            PREVIOUS
          </BrutalButton>

          <div className="flex items-center gap-2">
            {currentIdx < questions.length - 1 ? (
              <BrutalButton
                variant="primary"
                size="sm"
                onClick={() => setCurrentIdx((i) => i + 1)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                NEXT
              </BrutalButton>
            ) : (
              <BrutalButton
                variant="mint"
                size="md"
                onClick={handleSubmit}
                disabled={submitting}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                {submitting ? 'EVALUATING...' : '[ SUBMIT TEST ]'}
              </BrutalButton>
            )}
          </div>
        </div>
      </BrutalCard>
    </div>
  );
};
