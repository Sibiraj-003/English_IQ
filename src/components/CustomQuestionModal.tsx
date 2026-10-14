import React, { useState } from 'react';
import { BrutalCard } from './BrutalCard';
import { BrutalButton } from './BrutalButton';
import { Question, SchoolClass } from '../types';
import { api } from '../services/api';
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface CustomQuestionModalProps {
  isOpen: boolean;
  classes: SchoolClass[];
  defaultClassId?: string;
  defaultBookId?: string;
  defaultLessonId?: string;
  onClose: () => void;
  onSuccess: (question: Question) => void;
}

export const CustomQuestionModal: React.FC<CustomQuestionModalProps> = ({
  isOpen,
  classes,
  defaultClassId,
  defaultBookId,
  defaultLessonId,
  onClose,
  onSuccess,
}) => {
  const [classId, setClassId] = useState(defaultClassId || (classes[0]?.id || 'CLS001'));
  const [topic, setTopic] = useState('English Grammar');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [questionType, setQuestionType] = useState<'MCQ' | 'fill_in_the_blanks' | 'true_false' | 'short_answer'>('MCQ');
  const [questionText, setQuestionText] = useState('');
  
  // MCQ Options
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  
  // Fill in blanks / Short answer
  const [textCorrectAnswer, setTextCorrectAnswer] = useState('');
  
  // True / False
  const [tfCorrectAnswer, setTfCorrectAnswer] = useState<'True' | 'False'>('True');

  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<'approved' | 'draft'>('approved');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== idx);
    setOptions(newOpts);
    if (correctAnswerIndex === idx) {
      setCorrectAnswerIndex(0);
    } else if (correctAnswerIndex > idx) {
      setCorrectAnswerIndex(correctAnswerIndex - 1);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError('Please enter the question text.');
      return;
    }

    let finalOptions: string[] = [];
    let finalCorrectAnswer = '';

    if (questionType === 'MCQ') {
      const trimmedOptions = options.map((o) => o.trim());
      if (trimmedOptions.some((o) => !o)) {
        setError('Please fill in all options or remove empty ones.');
        return;
      }
      if (trimmedOptions.length < 2) {
        setError('At least 2 options are required for multiple choice questions.');
        return;
      }
      finalOptions = trimmedOptions;
      finalCorrectAnswer = trimmedOptions[correctAnswerIndex] || trimmedOptions[0];
    } else if (questionType === 'true_false') {
      finalOptions = ['True', 'False'];
      finalCorrectAnswer = tfCorrectAnswer;
    } else {
      // fill in the blanks or short answer
      if (!textCorrectAnswer.trim()) {
        setError('Please specify the expected correct answer.');
        return;
      }
      finalOptions = [];
      finalCorrectAnswer = textCorrectAnswer.trim();
    }

    setSaving(true);
    try {
      const res = await api.createQuestion({
        class_id: classId,
        book_id: defaultBookId,
        lesson_id: defaultLessonId,
        topic: topic.trim() || 'General English',
        question_text: questionText.trim(),
        question_type: questionType,
        options: finalOptions,
        correct_answer: finalCorrectAnswer,
        explanation: explanation.trim() || undefined,
        difficulty,
        status,
      });

      onSuccess(res.question);
      onClose();
    } catch (err: any) {
      console.error('Failed to create custom question:', err);
      setError(err.message || 'Failed to save custom question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 border-2 border-[#0F172A] bg-slate-100 hover:bg-rose-100 transition-colors shadow-[2px_2px_0px_#0F172A]"
          title="Close dialog"
        >
          <X className="w-4 h-4 text-[#0F172A]" />
        </button>

        {/* Top Header Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] uppercase flex items-center gap-1">
            <Plus className="w-3 h-3" />
            QUESTION_AUTHORING // CUSTOM_QUESTION
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-1">
          Add Custom Question
        </h3>
        <p className="text-xs text-slate-600 font-sans mb-4">
          Author your own questions and custom options. Approved questions are instantly available for tests and homework.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-rose-100 border-2 border-[#0F172A] text-rose-800 text-xs font-bold shadow-[2px_2px_0px_#0F172A]">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class & Topic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                Target Class
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                Grammar Topic / Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Nouns, Verbs, Reading Comprehension"
                className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
              />
            </div>
          </div>

          {/* Difficulty & Question Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
              >
                <option value="Easy">Easy (Grade Foundation)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Advanced Challenge)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                Question Format
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_the_blanks">Fill in the Blanks</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
              Question Text *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Identify the noun in this sentence: 'The puppy ran across the green lawn.'"
              className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white font-sans focus:outline-none"
              required
            />
          </div>

          {/* Options Section */}
          {questionType === 'MCQ' && (
            <div className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1">
                  <span>Question Options & Correct Answer</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Select radio button for the correct answer)
                  </span>
                </label>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold px-2 py-0.5 border border-[#0F172A] bg-[#A7F3D0] hover:bg-[#86EFAC] text-[#0F172A] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Radio to mark correct answer */}
                    <label
                      className={`flex items-center justify-center w-7 h-7 border-2 border-[#0F172A] cursor-pointer font-bold text-xs shrink-0 transition-colors ${
                        correctAnswerIndex === idx
                          ? 'bg-[#10B981] text-white shadow-[1px_1px_0px_#0F172A]'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Select as correct answer"
                    >
                      <input
                        type="radio"
                        name="correct_answer_radio"
                        checked={correctAnswerIndex === idx}
                        onChange={() => setCorrectAnswerIndex(idx)}
                        className="sr-only"
                      />
                      {String.fromCharCode(65 + idx)}
                    </label>

                    {/* Option Text Input */}
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className={`flex-1 px-3 py-1.5 border-2 border-[#0F172A] text-sm font-bold bg-white ${
                        correctAnswerIndex === idx ? 'border-emerald-600 ring-1 ring-emerald-500' : ''
                      }`}
                    />

                    {/* Remove Option */}
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 border border-[#0F172A] bg-white text-rose-600 hover:bg-rose-50"
                        title="Remove option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* True / False Options */}
          {questionType === 'true_false' && (
            <div className="p-4 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              <label className="block text-xs font-extrabold text-[#0F172A] mb-2 uppercase">
                Select Correct Answer:
              </label>
              <div className="flex gap-4">
                {(['True', 'False'] as const).map((val) => (
                  <label
                    key={val}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-[#0F172A] cursor-pointer font-extrabold text-sm shadow-[2px_2px_0px_#0F172A] ${
                      tfCorrectAnswer === val
                        ? 'bg-[#A7F3D0] text-[#0F172A]'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tf_answer"
                      value={val}
                      checked={tfCorrectAnswer === val}
                      onChange={() => setTfCorrectAnswer(val)}
                      className="accent-[#0F172A]"
                    />
                    {val}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fill in the blanks or Short answer */}
          {(questionType === 'fill_in_the_blanks' || questionType === 'short_answer') && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                Expected Correct Answer / Keyword *
              </label>
              <input
                type="text"
                value={textCorrectAnswer}
                onChange={(e) => setTextCorrectAnswer(e.target.value)}
                placeholder="e.g. puppy"
                className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
                required
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
              Answer Explanation / Hint (Optional)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. A noun is a word that names a person, place, animal, or thing."
              className="w-full px-3 py-2 border-2 border-[#0F172A] text-xs font-medium bg-white"
            />
          </div>

          {/* Initial Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border-2 border-[#0F172A]">
            <span className="text-xs font-bold text-[#0F172A]">
              INITIAL QUESTION STATUS:
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="custom_status"
                  value="approved"
                  checked={status === 'approved'}
                  onChange={() => setStatus('approved')}
                  className="accent-[#0F172A]"
                />
                APPROVED (Ready for Tests)
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer ml-3">
                <input
                  type="radio"
                  name="custom_status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="accent-[#0F172A]"
                />
                DRAFT (Pending Review)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#0F172A]">
            <BrutalButton
              type="button"
              variant="white"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              CANCEL
            </BrutalButton>

            <BrutalButton
              type="submit"
              variant="mint"
              size="sm"
              disabled={saving}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {saving ? 'SAVING QUESTION...' : 'SAVE CUSTOM QUESTION'}
            </BrutalButton>
          </div>
        </form>
      </div>
    </div>
  );
};
