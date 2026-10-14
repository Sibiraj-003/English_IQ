import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LessonReaderModal } from '../../components/LessonReaderModal';
import { api } from '../../services/api';
import { SchoolClass, Book, Lesson, Test } from '../../types';
import {
  GraduationCap,
  BookOpen,
  Upload,
  Layers,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trash2,
  Eye,
} from 'lucide-react';

export const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await api.getClass(id);
      setClassData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteBook = async () => {
    if (!bookToDelete || !id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteBook(bookToDelete.id);
      setBookToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'Failed to remove textbook');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !classData) {
    return (
      <div className="p-12 text-center font-mono font-bold">
        LOADING_CLASS_DATA...
      </div>
    );
  }

  const books: Book[] = classData.books || [];
  const lessons: Lesson[] = classData.lessons || [];
  const tests: Test[] = classData.tests || [];

  return (
    <div className="space-y-6">
      {/* Top back & actions */}
      <div className="flex items-center justify-between">
        <BrutalButton
          variant="white"
          size="sm"
          onClick={() => navigate('/teacher/classes')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          BACK TO CLASSES
        </BrutalButton>

        <div className="flex gap-2">
          <BrutalButton
            variant="mint"
            size="sm"
            onClick={() => navigate('/teacher/books/upload')}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            + UPLOAD TEXTBOOK FOR {classData.name}
          </BrutalButton>
          <BrutalButton
            variant="amber"
            size="sm"
            onClick={() => navigate('/teacher/analytics')}
          >
            VIEW ANALYTICS
          </BrutalButton>
        </div>
      </div>

      {/* Class Overview Banner */}
      <BrutalCard size="large" accent="lavender" className="p-6">
        <div className="flex justify-between items-start mb-2 font-mono">
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
            {classData.name.toUpperCase().replace(/\s/g, '_')} // CURRICULUM_WORKSPACE
          </span>
          <Badge variant="mint">CURRICULUM_ISOLATION // ACTIVE</Badge>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
          {classData.name} English Curriculum
        </h2>
        <p className="text-xs text-slate-600 font-mono mt-1 max-w-2xl">
          {classData.description || 'Foundational phonics, reading passages, and parts of speech'}
        </p>
      </BrutalCard>

      {/* Section 1: Assigned Textbooks */}
      <BrutalCard size="large" className="p-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 font-mono">
          <div>
            <span className="font-extrabold text-sm text-[#0F172A]">ASSIGNED_TEXTBOOKS // {books.length}</span>
            <p className="text-[11px] text-slate-500">Primary knowledge source used for RAG student responses</p>
          </div>
          <BrutalButton
            variant="lavender"
            size="sm"
            onClick={() => navigate('/teacher/books/upload')}
          >
            + ADD BOOK
          </BrutalButton>
        </div>

        {books.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-[#0F172A] bg-slate-50 font-mono text-xs font-bold text-slate-600">
            NO_TEXTBOOK_UPLOADED_YET. Click above to upload a PDF textbook for {classData.name}.
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/teacher/books/${b.id}`)}
                className="p-4 border-2 border-[#0F172A] bg-white hover:bg-[#FEFCE8] cursor-pointer transition-all shadow-[2px_2px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-[#0F172A]" />
                    <span className="font-extrabold text-sm text-[#0F172A]">{b.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">{b.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="mint">BOOK_READY // ONLINE</Badge>
                  <BrutalButton
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookToDelete(b);
                    }}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    title="Delete or remove this textbook"
                  >
                    REMOVE
                  </BrutalButton>
                  <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </BrutalCard>

      {/* Section 2: Curriculum Lessons */}
      <BrutalCard size="large" className="p-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 font-mono">
          <span className="font-extrabold text-sm text-[#0F172A]">CURRICULUM_LESSONS // {lessons.length}</span>
          <BrutalButton
            variant="white"
            size="sm"
            onClick={() => navigate('/teacher/lessons')}
          >
            MANAGE LESSONS
          </BrutalButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson)}
              className="p-3 border-2 border-[#0F172A] bg-[#F8FAFC] hover:bg-white cursor-pointer transition-all flex justify-between items-center shadow-[1.5px_1.5px_0px_#0F172A]"
            >
              <div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#0F172A] text-white mr-2">
                  LESSON {idx + 1}
                </span>
                <span className="text-xs font-bold text-[#0F172A]">{lesson.title}</span>
                <div className="text-[10px] text-slate-500 mt-1">
                  Grammar: {lesson.grammar_topics?.join(', ') || 'General English'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="white">{lesson.difficulty || 'Easy'}</Badge>
                <BrutalButton
                  variant="lavender"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLesson(lesson);
                  }}
                  icon={<Eye className="w-3 h-3" />}
                >
                  OPEN
                </BrutalButton>
              </div>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Confirmation Modal for Book Deletion */}
      <ConfirmModal
        isOpen={!!bookToDelete}
        title={`DELETE TEXTBOOK: ${bookToDelete?.title || ''}`}
        message={`Are you sure you want to remove this book from ${classData.name}? If this book was uploaded by mistake or in the wrong class/subject, deleting it will remove all extracted lessons, generated questions, and AI vector embeddings. This action is permanent.`}
        confirmText="DELETE BOOK"
        cancelText="CANCEL"
        loading={deleting}
        onConfirm={handleDeleteBook}
        onCancel={() => {
          if (!deleting) {
            setBookToDelete(null);
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
        isOpen={!!selectedLesson}
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onGenerateQuestions={(les) => {
          navigate(`/teacher/questions?class_id=${id}&lesson_id=${les.id}`);
        }}
        onNavigateFullView={(lessonId) => {
          navigate(`/teacher/lessons/${lessonId}`);
        }}
      />
    </div>
  );
};
