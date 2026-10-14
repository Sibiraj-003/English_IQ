import React, { useState, useEffect } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export const StudentPractice: React.FC = () => {
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<'Pronouns' | 'Nouns' | 'Verbs'>('Pronouns');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Personalized practice questions tailored to Class 1 student weak topic (Pronouns 55%)
  const practiceQuestions: Record<string, PracticeQuestion[]> = {
    Pronouns: [
      {
        id: 'p1',
        question: 'Sam is a boy. Which word can we use for Sam? "_____ loves to read."',
        options: ['She', 'He', 'It', 'They'],
        correct: 'He',
        explanation: 'We use "He" when talking about a boy or man!',
      },
      {
        id: 'p2',
        question: 'Tina is a girl. Which word replaces Tina? "_____ has a red balloon."',
        options: ['He', 'She', 'It', 'We'],
        correct: 'She',
        explanation: 'We use "She" when talking about a girl or lady!',
      },
      {
        id: 'p3',
        question: 'Bruno is a puppy. What word can we use for Bruno? "_____ wags its tail."',
        options: ['He', 'She', 'It', 'I'],
        correct: 'It',
        explanation: 'We use "It" for animals and objects!',
      },
      {
        id: 'p4',
        question: 'Choose the correct sentence:',
        options: [
          'Mother is cooking. She is kind.',
          'Mother is cooking. He is kind.',
          'Mother is cooking. It is kind.',
          'Mother is cooking. Him is kind.',
        ],
        correct: 'Mother is cooking. She is kind.',
        explanation: 'Mother is female, so "She" is the correct pronoun.',
      },
      {
        id: 'p5',
        question: 'Leo and Tina are playing. "_____ build a sandcastle."',
        options: ['He', 'She', 'They', 'It'],
        correct: 'They',
        explanation: 'When talking about more than one person, we use "They"!',
      },
    ],
    Nouns: [
      {
        id: 'n1',
        question: 'Which word names an animal? "The cat sits on the mat."',
        options: ['cat', 'sits', 'on', 'mat'],
        correct: 'cat',
        explanation: '"cat" is the naming word for an animal.',
      },
      {
        id: 'n2',
        question: 'Find the thing noun: "I write with my pencil."',
        options: ['write', 'with', 'my', 'pencil'],
        correct: 'pencil',
        explanation: '"pencil" is the naming word for a thing.',
      },
    ],
    Verbs: [
      {
        id: 'v1',
        question: 'Which word is an action word? "The bird sings sweetly."',
        options: ['bird', 'sings', 'sweetly', 'the'],
        correct: 'sings',
        explanation: '"sings" is what the bird is doing (Action Word).',
      },
    ],
  };

  const currentList = practiceQuestions[selectedTopic] || practiceQuestions['Pronouns'];
  const currentQ = currentList[activeQuestionIdx];

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    if (opt.trim().toLowerCase() === currentQ.correct.trim().toLowerCase()) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (activeQuestionIdx < currentList.length - 1) {
      setActiveQuestionIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
    }
  };

  const resetPractice = () => {
    setActiveQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="space-y-6 font-mono w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
              PERSONALIZED_PRACTICE // WEAK_TOPIC_FOCUS
            </span>
            <Badge variant="mint">ADAPTIVE</Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
            Targeted Skill Practice
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Practice key curriculum grammar topics and master challenging questions at your own pace.
          </p>
        </div>

        {/* Topic Selector Pills */}
        <div className="flex gap-2">
          {(['Pronouns', 'Nouns', 'Verbs'] as const).map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setSelectedTopic(topic);
                resetPractice();
              }}
              className={`px-3 py-1.5 text-xs font-extrabold border-2 border-[#0F172A] transition-all ${
                selectedTopic === topic
                  ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#A7F3D0]'
                  : 'bg-white text-[#0F172A] hover:bg-slate-50 shadow-[2px_2px_0px_#0F172A]'
              }`}
            >
              {topic} {topic === 'Pronouns' ? '⚠️' : '✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Concept Card */}
      <BrutalCard size="normal" accent="amber" className="p-5">
        <h4 className="text-sm font-extrabold text-[#0F172A] uppercase mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Quick Rule: {selectedTopic}
        </h4>
        <p className="text-xs text-slate-700 font-sans leading-relaxed">
          {selectedTopic === 'Pronouns' &&
            'Remember: We use "He" for boys (Sam, father), "She" for girls (Tina, mother), and "It" for animals (Bruno, bird) and things (ball, house)!'}
          {selectedTopic === 'Nouns' &&
            'Naming words tell us the name of a person, place, animal, or thing.'}
          {selectedTopic === 'Verbs' &&
            'Action words tell us what someone or something does (run, jump, sing, play).'}
        </p>
      </BrutalCard>

      {/* Practice Question Card */}
      {!completed ? (
        <BrutalCard size="large" accent="lavender" className="p-6 sm:p-8">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
              QUESTION {activeQuestionIdx + 1} OF {currentList.length}
            </span>
            <span className="text-xs font-bold text-slate-500">
              CURRENT SCORE: {score}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-6">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt.trim().toLowerCase() === currentQ.correct.trim().toLowerCase();

              let style = 'bg-white hover:bg-[#FEFCE8] text-[#0F172A]';
              if (isAnswered) {
                if (isCorrect) {
                  style = 'bg-[#A7F3D0] text-[#0F172A] border-emerald-600 shadow-[2px_2px_0px_#0F172A]';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-100 text-rose-900 border-rose-500 shadow-[2px_2px_0px_#0F172A]';
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`w-full p-3.5 border-2 border-[#0F172A] text-left text-sm font-bold transition-all shadow-[2px_2px_0px_#0F172A] flex items-center justify-between ${style}`}
                >
                  <span className="font-sans">
                    {String.fromCharCode(65 + oIdx)}. {opt}
                  </span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-700" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next */}
          {isAnswered && (
            <div className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] mb-6 shadow-[2px_2px_0px_#0F172A]">
              <div className="font-bold text-xs text-[#0F172A] mb-1">
                {selectedOption === currentQ.correct ? '🌟 EXCELLENT!' : '💡 LEARNING TIP:'}
              </div>
              <p className="text-xs text-slate-700 font-sans">{currentQ.explanation}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <BrutalButton
              variant="primary"
              disabled={!isAnswered}
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {activeQuestionIdx < currentList.length - 1 ? 'NEXT QUESTION' : 'FINISH PRACTICE'}
            </BrutalButton>
          </div>
        </BrutalCard>
      ) : (
        /* Completed Practice Summary */
        <BrutalCard size="large" accent="mint" className="p-8 text-center">
          <Award className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
            PRACTICE_COMPLETED // {selectedTopic.toUpperCase()}
          </span>
          <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-2 mb-2">
            Great Work, {user?.full_name?.split(' ')[0] || 'Student'}!
          </h3>
          <p className="text-xs text-slate-600 mb-6">
            You scored <strong>{score} / {currentList.length}</strong> ({Math.round((score / currentList.length) * 100)}%). Your mastery in {selectedTopic} has improved!
          </p>

          <div className="flex justify-center gap-3">
            <BrutalButton variant="lavender" onClick={resetPractice} icon={<RotateCcw className="w-4 h-4" />}>
              TRY AGAIN
            </BrutalButton>
            <BrutalButton variant="primary" onClick={() => (window.location.href = '/student/tests')}>
              TAKE UNIT TEST
            </BrutalButton>
          </div>
        </BrutalCard>
      )}
    </div>
  );
};
