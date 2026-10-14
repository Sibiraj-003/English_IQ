import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Lesson } from '../../types';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';

export const StudentLessons: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getLessons({ class_id: user.class_id || undefined })
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching lessons:', err);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
            STUDENT_CURRICULUM // OFFICIAL_LESSONS
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Curriculum English Lessons
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Read stories, learn new vocabulary words, and discover exciting grammar concepts!
          </p>
        </div>

        <BrutalButton
          variant="lavender"
          onClick={() => navigate('/student/ai-teacher')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          [ ASK AI TEACHER ]
        </BrutalButton>
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          label="TEXTBOOK // EMPTY"
          title="NO TEXTBOOK AVAILABLE"
          description="Please ask your teacher to upload the class textbook."
          actionText="ASK AI TEACHER"
          onAction={() => navigate('/student/ai-teacher')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, idx) => {
            const colors: Array<'lavender' | 'mint' | 'amber' | 'sky' | 'pink'> = [
              'lavender',
              'mint',
              'amber',
              'sky',
              'pink',
            ];
            const accent = colors[idx % colors.length];

            return (
              <BrutalCard
                key={lesson.id}
                size="normal"
                accent={accent}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                      LESSON 0{idx + 1}
                    </span>
                    <Badge variant="white">{lesson.difficulty || 'Easy'}</Badge>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-2">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed mb-4 line-clamp-3">
                    {lesson.summary || lesson.content}
                  </p>

                  <div className="p-3 bg-[#F8FAFC] border-2 border-[#0F172A] mb-6 text-xs space-y-1.5 font-bold">
                    <div className="text-[#0F172A]">
                      <span className="text-slate-500">Grammar: </span>
                      {lesson.grammar_topics?.join(', ') || 'General English'}
                    </div>
                    {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                      <div className="text-indigo-700">
                        <span className="text-slate-500">Words: </span>
                        {lesson.vocabulary.slice(0, 4).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <BrutalButton
                  variant="primary"
                  onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                  className="w-full"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  [ READ LESSON ]
                </BrutalButton>
              </BrutalCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
