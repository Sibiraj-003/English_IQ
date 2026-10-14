import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LessonReaderModal } from '../../components/LessonReaderModal';
import { api } from '../../services/api';
import { Book, Lesson, Chapter, GrammarTopic } from '../../types';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Layers,
  FileCheck,
  CheckCircle,
  HelpCircle,
  Trash2,
  Eye,
} from 'lucide-react';

export const BookInspection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedLessonForModal, setSelectedLessonForModal] = useState<Lesson | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await api.getBook(id);
        setBook(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDeleteBook = async () => {
    if (!book || !id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteBook(id);
      navigate('/teacher/books');
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !book) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600">
        LOADING_BOOK_ANALYSIS...
      </div>
    );
  }

  const chapters: Chapter[] = book.chapters || [];
  const lessons: Lesson[] = book.lessons || [];
  const grammarTopics: GrammarTopic[] = book.grammar_topics || [];
  const vocabulary: string[] = book.vocabulary || [];

  return (
    <div className="space-y-6 font-mono">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BrutalButton
          variant="white"
          size="sm"
          onClick={() => navigate('/teacher/books')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          BACK TO TEXTBOOKS
        </BrutalButton>

        <div className="flex items-center gap-2">
          <BrutalButton
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            DELETE BOOK
          </BrutalButton>
          <BrutalButton
            variant="mint"
            size="sm"
            onClick={() => navigate('/teacher/questions')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            [ GENERATE QUESTIONS FROM BOOK ]
          </BrutalButton>
        </div>
      </div>

      {/* Book Header Card */}
      <BrutalCard size="large" accent="lavender" className="p-6">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
              CLASS_01 // TEXTBOOK
            </span>
            <Badge variant="mint">BOOK_READY // ONLINE</Badge>
          </div>
          <span className="text-xs font-bold text-slate-500">
            ID: {book.id}
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
          {book.title}
        </h2>
        <p className="text-xs text-slate-600 font-sans mt-1 max-w-3xl">
          {book.description}
        </p>

        {/* Technical Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">PAGES</div>
            <div className="text-xl font-extrabold text-[#0F172A]">{book.page_count || 0}</div>
          </div>
          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">LESSONS</div>
            <div className="text-xl font-extrabold text-[#0F172A]">{lessons.length}</div>
          </div>
          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">GRAMMAR TOPICS</div>
            <div className="text-xl font-extrabold text-[#0F172A]">{grammarTopics.length}</div>
          </div>
          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">VOCABULARY</div>
            <div className="text-xl font-extrabold text-[#0F172A]">{vocabulary.length}</div>
          </div>
        </div>
      </BrutalCard>

      {/* Chapters & Lessons Extracted Breakdown (Requirement 62) */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-[#0F172A] uppercase flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Extracted Curriculum Structure & Units
        </h3>

        {chapters.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] font-mono">
            <div className="font-extrabold text-[#0F172A] uppercase">NO CHAPTERS EXTRACTED YET</div>
            <p className="text-xs text-slate-500 mt-1">
              Textbook extraction in progress or book contains unsegmented pages.
            </p>
          </div>
        ) : (
          chapters.map((ch, idx) => {
            const unitLessons = lessons.filter(
              (l) => l.chapter_id === ch.id || (!l.chapter_id && idx === 0)
            );

            return (
              <BrutalCard key={ch.id} size="normal" className="p-6">
                <div className="flex justify-between items-center pb-2 border-b-2 border-[#0F172A] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
                      UNIT 0{ch.chapter_number}
                    </span>
                    <span className="text-sm font-extrabold text-[#0F172A]">{ch.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">
                    Pages {(idx * 8) + 1}–{(idx * 8) + 8}
                  </span>
                </div>

                <div className="space-y-4">
                  {unitLessons.map((l) => (
                    <div
                      key={l.id}
                      className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-sans font-extrabold text-sm text-[#0F172A]">
                          {l.title}
                        </h4>
                        <Badge variant="white">{l.difficulty}</Badge>
                      </div>

                      <p className="text-xs text-slate-700 font-sans mb-3 line-clamp-2">
                        {l.content}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-[#0F172A] mt-3">
                        <div className="flex flex-wrap gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 font-bold">Grammar: </span>
                            <span className="font-extrabold text-[#0F172A]">
                              {l.grammar_topics && l.grammar_topics.length > 0
                                ? l.grammar_topics.join(', ')
                                : 'None'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold">Vocabulary: </span>
                            <span className="font-extrabold text-indigo-700">
                              {l.vocabulary && l.vocabulary.length > 0
                                ? l.vocabulary.slice(0, 6).join(', ')
                                : 'None'}
                            </span>
                          </div>
                        </div>

                        <BrutalButton
                          variant="lavender"
                          size="sm"
                          onClick={() => setSelectedLessonForModal(l)}
                          icon={<BookOpen className="w-3.5 h-3.5" />}
                        >
                          OPEN LESSON IN PORTAL
                        </BrutalButton>
                      </div>
                    </div>
                  ))}
                </div>
              </BrutalCard>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title={`DELETE TEXTBOOK: ${book.title}`}
        message={`Are you sure you want to delete "${book.title}"? If this book was uploaded for the wrong subject or grade, removing it will wipe out all extracted chapters, lessons, questions, and RAG vector embeddings permanently.`}
        confirmText="DELETE BOOK"
        cancelText="CANCEL"
        loading={deleting}
        onConfirm={handleDeleteBook}
        onCancel={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeleteError(null);
          }
        }}
      />

      {deleteError && (
        <div className="p-4 bg-rose-100 border-2 border-[#0F172A] text-rose-700 text-xs font-mono font-bold flex justify-between items-center shadow-[2px_2px_0px_#0F172A]">
          <span>ERROR: {deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="px-2 py-0.5 border border-[#0F172A] bg-white text-[#0F172A] text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Lesson Reader Modal for Portal Viewing */}
      <LessonReaderModal
        isOpen={!!selectedLessonForModal}
        lesson={selectedLessonForModal}
        onClose={() => setSelectedLessonForModal(null)}
        onGenerateQuestions={(les) => {
          navigate(`/teacher/questions?class_id=${book.class_id}&book_id=${book.id}&lesson_id=${les.id}`);
        }}
        onNavigateFullView={(lessonId) => {
          navigate(`/teacher/lessons/${lessonId}`);
        }}
      />
    </div>
  );
};
