import React, { useState } from 'react';
import { BrutalCard } from './BrutalCard';
import { BrutalButton } from './BrutalButton';
import { Badge } from './Badge';
import { SourceBadge } from './SourceBadge';
import { Lesson } from '../types';
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
} from 'lucide-react';

interface LessonReaderModalProps {
  isOpen: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onGenerateQuestions?: (lesson: Lesson) => void;
  onNavigateFullView?: (lessonId: string) => void;
}

export const LessonReaderModal: React.FC<LessonReaderModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onGenerateQuestions,
  onNavigateFullView,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen || !lesson) return null;

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${lesson.title}. ${lesson.summary || ''}. ${lesson.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleClose = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 border-2 border-[#0F172A] bg-slate-100 hover:bg-rose-100 transition-colors shadow-[2px_2px_0px_#0F172A]"
          title="Close Lesson Viewer"
        >
          <X className="w-4 h-4 text-[#0F172A]" />
        </button>

        {/* Top Header Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] uppercase flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            LESSON_PORTAL_VIEW // {lesson.chapter_title || 'CURRICULUM UNIT'}
          </span>
          <Badge variant="mint">{lesson.difficulty || 'Easy'}</Badge>
          {lesson.source_page && (
            <SourceBadge
              bookTitle={lesson.book_title || 'Curriculum Textbook'}
              pageNumber={lesson.source_page}
              lessonTitle={lesson.title}
            />
          )}
        </div>

        {/* Lesson Title & Audio Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#0F172A] mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-sans">
            {lesson.title}
          </h2>
          <BrutalButton
            variant={isSpeaking ? 'amber' : 'white'}
            size="sm"
            onClick={handleSpeechToggle}
            icon={isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            title="Listen to lesson"
          >
            {isSpeaking ? 'STOP AUDIO' : 'READ ALOUD'}
          </BrutalButton>
        </div>

        {/* Lesson Summary */}
        {lesson.summary && (
          <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] text-xs font-sans text-slate-800 mb-6 shadow-[2px_2px_0px_#0F172A]">
            <strong className="font-mono uppercase font-extrabold text-[#0F172A] block mb-1">
              LESSON SUMMARY & LEARNING OBJECTIVE:
            </strong>
            {lesson.summary}
          </div>
        )}

        {/* Textbook Reading Passage */}
        <div className="bg-[#F8FAFC] p-6 border-2 border-[#0F172A] mb-6 shadow-[3px_3px_0px_#0F172A]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-[#0F172A] text-white">
              EXTRACTED READING PASSAGE
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              ORIGINAL TEXTBOOK SOURCE
            </span>
          </div>
          <p className="font-sans text-base sm:text-lg text-slate-900 leading-relaxed font-normal whitespace-pre-line">
            {lesson.content || 'No text extracted for this lesson.'}
          </p>
        </div>

        {/* Grammar Topics & Vocabulary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Grammar Topics */}
          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <h4 className="text-xs font-extrabold text-[#0F172A] uppercase mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Grammar Focus Topics
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {lesson.grammar_topics && lesson.grammar_topics.length > 0 ? (
                lesson.grammar_topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] text-xs font-bold"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No specific grammar topics</span>
              )}
            </div>
          </div>

          {/* Vocabulary */}
          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <h4 className="text-xs font-extrabold text-[#0F172A] uppercase mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Target Vocabulary
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {lesson.vocabulary && lesson.vocabulary.length > 0 ? (
                lesson.vocabulary.map((vocab, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#BAE6FD] text-[#0F172A] border border-[#0F172A] text-xs font-bold capitalize"
                  >
                    {vocab}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No specific vocabulary words</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-[#0F172A]">
          <BrutalButton variant="white" size="sm" onClick={handleClose}>
            CLOSE
          </BrutalButton>

          <div className="flex flex-wrap items-center gap-2">
            {onGenerateQuestions && (
              <BrutalButton
                variant="mint"
                size="sm"
                onClick={() => {
                  handleClose();
                  onGenerateQuestions(lesson);
                }}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                GENERATE QUESTIONS
              </BrutalButton>
            )}

            {onNavigateFullView && (
              <BrutalButton
                variant="lavender"
                size="sm"
                onClick={() => {
                  handleClose();
                  onNavigateFullView(lesson.id);
                }}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                OPEN FULL PAGE VIEW
              </BrutalButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
