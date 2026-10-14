import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { LessonReaderModal } from '../../components/LessonReaderModal';
import { api } from '../../services/api';
import { Lesson } from '../../types';
import { Layers, Sparkles, BookOpen } from 'lucide-react';

export const TeacherLessons: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    api.getLessons().then((data) => {
      setLessons(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
            LESSON_REGISTRY // CURRICULUM
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Curriculum Lessons & Grammar
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Structured learning units extracted from uploaded textbooks.
          </p>
        </div>

        <BrutalButton
          variant="lavender"
          onClick={() => navigate('/teacher/questions')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          GENERATE QUESTIONS
        </BrutalButton>
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          label="LESSONS // EMPTY"
          title="NO LESSONS EXTRACTED YET"
          description="Upload a textbook to automatically extract structured lessons, vocabulary, and grammar units."
          actionText="UPLOAD TEXTBOOK"
          onAction={() => navigate('/teacher/books/upload')}
        />
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, idx) => (
            <BrutalCard key={lesson.id} size="normal" className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#0F172A] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                    LESSON 0{idx + 1}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#0F172A] font-sans">
                    {lesson.title}
                  </h3>
                </div>
                <Badge variant="mint">{lesson.difficulty || 'Standard'}</Badge>
              </div>

              <div className="bg-[#F8FAFC] p-4 border-2 border-[#0F172A] mb-4 text-xs font-sans text-slate-800 leading-relaxed shadow-[2px_2px_0px_#0F172A]">
                {lesson.content}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-white border border-[#0F172A]">
                  <span className="text-slate-500 font-bold block mb-1">GRAMMAR TOPICS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.grammar_topics && lesson.grammar_topics.length > 0 ? (
                      lesson.grammar_topics.map((g, gIdx) => (
                        <span key={gIdx} className="px-2 py-0.5 bg-[#C4B5FD] border border-[#0F172A] font-bold text-[#0F172A]">
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None specified</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#0F172A]">
                  <span className="text-slate-500 font-bold block mb-1">TARGET VOCABULARY:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.vocabulary && lesson.vocabulary.length > 0 ? (
                      lesson.vocabulary.map((v, vIdx) => (
                        <span key={vIdx} className="px-2 py-0.5 bg-[#BAE6FD] border border-[#0F172A] font-bold text-[#0F172A]">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None specified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t-2 border-[#0F172A] mt-4">
                <BrutalButton
                  variant="lavender"
                  size="sm"
                  onClick={() => setSelectedLesson(lesson)}
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                >
                  OPEN LESSON IN PORTAL
                </BrutalButton>
              </div>
            </BrutalCard>
          ))}
        </div>
      )}

      {/* Lesson Reader Modal for Portal Viewing */}
      <LessonReaderModal
        isOpen={!!selectedLesson}
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onGenerateQuestions={(les) => {
          navigate(`/teacher/questions?class_id=${les.chapter_id || ''}&lesson_id=${les.id}`);
        }}
        onNavigateFullView={(lessonId) => {
          navigate(`/teacher/lessons/${lessonId}`);
        }}
      />
    </div>
  );
};
