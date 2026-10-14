import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { SourceBadge } from '../../components/SourceBadge';
import { api } from '../../services/api';
import { Lesson } from '../../types';
import {
  BookOpen,
  ArrowLeft,
  Bot,
  Sparkles,
  ClipboardCheck,
  Volume2,
} from 'lucide-react';

export const StudentLessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getLesson(id).then((data) => {
      setLesson(data);
      setLoading(false);
    });
  }, [id]);

  if (loading || !lesson) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_LESSON_CONTENT...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono w-full">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BrutalButton
          variant="white"
          size="sm"
          onClick={() => {
            if (role === 'teacher') {
              navigate('/teacher/lessons');
            } else {
              navigate('/student/lessons');
            }
          }}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          BACK TO LESSONS
        </BrutalButton>

        {/* Source Page Transparency (Requirement 26 & 65) */}
        <SourceBadge
          bookTitle={lesson.book_title || 'Curriculum Textbook'}
          pageNumber={lesson.source_page || 1}
          lessonTitle={lesson.title}
        />
      </div>

      {/* Main Lesson Content Card (Requirement 26) */}
      <BrutalCard size="large" accent="lavender" className="p-6 sm:p-8">
        <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
            {lesson.chapter_title?.toUpperCase() || 'LESSON'} // {lesson.title.toUpperCase()}
          </span>
          <Badge variant="mint">{lesson.difficulty || 'Easy'}</Badge>
        </div>

        <h2 className="text-3xl font-extrabold text-[#0F172A] font-sans mb-3">
          {lesson.title}
        </h2>

        {/* Summary callout */}
        <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] text-xs font-medium text-slate-800 mb-6 shadow-[2px_2px_0px_#0F172A]">
          <strong>LESSON SUMMARY:</strong> {lesson.summary || 'Official textbook lesson content.'}
        </div>

        {/* Textbook Reading Passage */}
        <div className="bg-white p-6 border-2 border-[#0F172A] mb-6 shadow-[3px_3px_0px_#0F172A]">
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-[#0F172A] text-white mb-3 inline-block">
            TEXTBOOK READING PASSAGE
          </span>
          <p className="font-sans text-base sm:text-lg text-slate-900 leading-relaxed font-medium">
            {lesson.content}
          </p>
        </div>

        {/* Vocabulary Cards */}
        <div className="mb-6">
          <h4 className="text-sm font-extrabold text-[#0F172A] uppercase mb-3">
            📚 Vocabulary Words
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {lesson.vocabulary?.map((vocab: string, vIdx: number) => (
              <div
                key={vIdx}
                className="p-3 bg-[#BAE6FD] border-2 border-[#0F172A] font-bold text-xs shadow-[2px_2px_0px_#0F172A] flex items-center justify-between"
              >
                <span className="capitalize">{vocab}</span>
                <span className="text-[10px] text-slate-700 uppercase">WORD</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grammar Topics & Examples */}
        <div className="mb-8">
          <h4 className="text-sm font-extrabold text-[#0F172A] uppercase mb-3">
            🧠 Grammar Rules & Examples
          </h4>
          <div className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-2 text-xs">
            {lesson.grammar_topics?.map((topic: string, tIdx: number) => (
              <div key={tIdx} className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-[#C4B5FD] text-[#0F172A] font-extrabold border border-[#0F172A]">
                  RULE {tIdx + 1}
                </span>
                <span className="font-bold text-slate-800">
                  {topic}: Words that name things, persons, or animals in your textbook story!
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t-2 border-[#0F172A]">
          {role === 'teacher' ? (
            <>
              <BrutalButton
                variant="mint"
                onClick={() => navigate('/teacher/questions')}
                icon={<Sparkles className="w-4 h-4" />}
              >
                [ GENERATE QUESTIONS ]
              </BrutalButton>
              <BrutalButton
                variant="lavender"
                onClick={() => navigate('/teacher/tests')}
                icon={<ClipboardCheck className="w-4 h-4" />}
              >
                [ TEST BUILDER ]
              </BrutalButton>
              <BrutalButton
                variant="white"
                onClick={() => navigate('/teacher/lessons')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                [ ALL LESSONS ]
              </BrutalButton>
            </>
          ) : (
            <>
              <BrutalButton
                variant="lavender"
                onClick={() => navigate('/student/ai-teacher')}
                icon={<Bot className="w-4 h-4" />}
              >
                [ ASK AI TEACHER ]
              </BrutalButton>
              <BrutalButton
                variant="mint"
                onClick={() => navigate('/student/practice')}
                icon={<Sparkles className="w-4 h-4" />}
              >
                [ PRACTICE EXERCISES ]
              </BrutalButton>
              <BrutalButton
                variant="sky"
                onClick={() => navigate('/student/tests')}
                icon={<ClipboardCheck className="w-4 h-4" />}
              >
                [ TAKE QUIZ ]
              </BrutalButton>
            </>
          )}
        </div>
      </BrutalCard>
    </div>
  );
};
