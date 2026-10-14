import React, { useState, useEffect } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { CustomQuestionModal } from '../../components/CustomQuestionModal';
import { api } from '../../services/api';
import { Question, SchoolClass } from '../../types';
import {
  HelpCircle,
  Sparkles,
  Check,
  X,
  Edit2,
  Trash2,
  Filter,
  AlertTriangle,
  BookOpen,
  Plus,
} from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'published'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  // Generator modal states
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(3);
  const [genDifficulty, setGenDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [genType, setGenType] = useState<'MCQ' | 'fill_in_the_blanks' | 'true_false' | 'short_answer'>('MCQ');
  const [genTopic, setGenTopic] = useState('Nouns & Pronouns');
  const [genClassId, setGenClassId] = useState('');
  const [generating, setGenerating] = useState(false);

  // Custom question authoring modal state
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Edit question modal states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const loadData = async () => {
    try {
      const [qData, cData] = await Promise.all([
        api.getQuestions(),
        api.getClasses(),
      ]);
      setQuestions(qData);
      setClasses(cData);
      if (cData.length > 0 && !genClassId) {
        setGenClassId(cData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateQuestions({
        class_id: genClassId || (classes[0]?.id || ''),
        count: genCount,
        difficulty: genDifficulty,
        question_type: genType,
        topic: genTopic,
      });
      setShowGenModal(false);
      loadData();
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.updateQuestion(id, { status: 'approved' });
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'approved' } : q))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.updateQuestion(id, { status: 'published' });
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'published' } : q))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      await api.updateQuestion(editingQuestion.id, editingQuestion);
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (topicFilter !== 'all' && !q.topic.toLowerCase().includes(topicFilter.toLowerCase())) return false;
    return true;
  });

  const pendingCount = questions.filter((q) => q.status === 'draft').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
              QUESTION_BANK // CURATED_REPOSITORY
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                {pendingCount} DRAFTS REQUIRE REVIEW
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans">
            Question Bank & AI Generator
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Teacher authority is enforced. AI generates draft candidates, but teachers must review, edit, and approve before tests are built.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <BrutalButton
            variant="lavender"
            onClick={() => setShowCustomModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            [ + ADD CUSTOM QUESTION ]
          </BrutalButton>
          <BrutalButton
            variant="mint"
            onClick={() => setShowGenModal(true)}
            icon={<Sparkles className="w-4 h-4" />}
          >
            [ + AI QUESTION GENERATOR ]
          </BrutalButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0F172A]" />
          <span className="font-bold uppercase">Status Filter:</span>
          {(['all', 'draft', 'approved', 'published'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 font-extrabold border border-[#0F172A] uppercase transition-all ${
                statusFilter === st
                  ? 'bg-[#0F172A] text-white shadow-[1.5px_1.5px_0px_#0F172A]'
                  : 'bg-white text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              {st} ({questions.filter((q) => (st === 'all' ? true : q.status === st)).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold uppercase">Topic:</span>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-2 py-1 bg-white border border-[#0F172A] font-bold"
          >
            <option value="all">ALL TOPICS</option>
            <option value="nouns">NOUNS</option>
            <option value="pronouns">PRONOUNS</option>
            <option value="verbs">VERBS</option>
            <option value="singular">SINGULAR & PLURAL</option>
            <option value="adjectives">ADJECTIVES</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          label="QUESTION_BANK // EMPTY"
          title="NO QUESTIONS IN BANK"
          description="No questions match the current filter. Use the AI generator or upload a textbook to create questions."
          actionText="GENERATE QUESTIONS"
          onAction={() => setShowGenModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isDraft = q.status === 'draft';
            const isApproved = q.status === 'approved';
            const isPublished = q.status === 'published';

            return (
              <BrutalCard
                key={q.id}
                size="normal"
                accent={isDraft ? 'amber' : isApproved ? 'sky' : 'mint'}
                className="p-6"
              >
                {/* Question Header & Review Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#0F172A] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                      {q.question_type}
                    </span>
                    <Badge variant="white">TOPIC: {q.topic}</Badge>
                    <Badge variant="white">DIFF: {q.difficulty}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDraft && (
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                        STATUS: DRAFT (NEEDS APPROVAL)
                      </span>
                    )}
                    {isApproved && (
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-[#BAE6FD] text-[#0F172A] border border-[#0F172A]">
                        STATUS: APPROVED
                      </span>
                    )}
                    {isPublished && (
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                        STATUS: PUBLISHED IN TEST
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <h4 className="text-base font-extrabold text-[#0F172A] font-sans mb-3">
                  {q.question_text}
                </h4>

                {/* Options List */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect =
                        opt === q.correct_answer ||
                        String.fromCharCode(65 + optIdx) === q.correct_answer;

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 border-2 border-[#0F172A] font-bold flex justify-between items-center ${
                            isCorrect
                              ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                              : 'bg-white text-slate-800'
                          }`}
                        >
                          <span>
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </span>
                          {isCorrect && (
                            <span className="text-[10px] font-extrabold uppercase bg-[#0F172A] text-white px-1.5 py-0.2">
                              CORRECT KEY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation & Source Transparency */}
                <div className="p-3 bg-[#F8FAFC] border border-[#0F172A] text-xs space-y-1 mb-4">
                  {q.explanation && (
                    <div className="text-slate-600 font-bold">
                      <strong>EXPLANATION:</strong> {q.explanation}
                    </div>
                  )}
                  <div className="text-indigo-800 font-bold flex items-center gap-1 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      SOURCE: {q.book_title || 'Curriculum Textbook'} // Page {q.source_page || 1}
                    </span>
                  </div>
                </div>

                {/* Teacher Control Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-[#0F172A]">
                  <div className="text-xs text-slate-500 font-bold">
                    QUESTION ID: {q.id}
                  </div>

                  <div className="flex items-center gap-2">
                    <BrutalButton
                      variant="white"
                      size="sm"
                      onClick={() => setEditingQuestion(q)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      EDIT
                    </BrutalButton>

                    {isDraft && (
                      <>
                        <BrutalButton
                          variant="mint"
                          size="sm"
                          onClick={() => handleApprove(q.id)}
                          icon={<Check className="w-3.5 h-3.5" />}
                        >
                          [ APPROVE ]
                        </BrutalButton>
                        <BrutalButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(q.id)}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          REJECT
                        </BrutalButton>
                      </>
                    )}

                    {isApproved && (
                      <BrutalButton
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(q.id)}
                      >
                        [ PUBLISH ]
                      </BrutalButton>
                    )}

                    <button
                      onClick={() => handleReject(q.id)}
                      className="p-1.5 border border-[#0F172A] bg-white text-rose-600 hover:bg-rose-50"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </BrutalCard>
            );
          })}
        </div>
      )}

      {/* AI Question Generator Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <BrutalCard size="large" accent="mint" className="w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
              <span className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                AI QUESTION GENERATOR
              </span>
              <button
                onClick={() => setShowGenModal(false)}
                className="font-bold text-xs px-2 py-0.5 border border-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                    Select Target Class
                  </label>
                  <select
                    value={genClassId}
                    onChange={(e) => setGenClassId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-extrabold text-[#0F172A] uppercase">
                      Number of Questions (Custom Size: 1 – 50)
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                      {genCount} {genCount === 1 ? 'QUESTION' : 'QUESTIONS'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={genCount}
                      onChange={(e) => setGenCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                      className="flex-1 accent-[#0F172A] cursor-pointer h-2"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={genCount}
                        onChange={(e) => setGenCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                        className="w-16 px-2 py-1 border-2 border-[#0F172A] text-sm font-extrabold text-center bg-white"
                      />
                      <span className="text-[11px] font-extrabold text-slate-500">COUNT</span>
                    </div>
                  </div>

                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Select:</span>
                    {[3, 5, 10, 15, 20, 25, 30, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGenCount(preset)}
                        className={`text-[11px] px-2 py-0.5 border font-extrabold transition-all ${
                          genCount === preset
                            ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[1px_1px_0px_#0F172A]'
                            : 'bg-white text-[#0F172A] border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                    Difficulty Level
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
                  >
                    <option value="Easy">Easy (Grade 1 Standard)</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                  Question Format
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="fill_in_the_blanks">Fill in the Blanks</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Grammar Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                  Curriculum Topic
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                  placeholder="e.g. Nouns, Pronouns, Verbs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  onClick={() => setShowGenModal(false)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  variant="primary"
                  disabled={generating}
                >
                  {generating ? 'GENERATING DRAFTS...' : '[ GENERATE DRAFT QUESTIONS ]'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <BrutalCard size="large" accent="lavender" className="w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
              <span className="font-extrabold text-sm text-[#0F172A]">
                EDIT_QUESTION // TEACHER_AUTHORITY
              </span>
              <button
                onClick={() => setEditingQuestion(null)}
                className="font-bold text-xs px-2 py-0.5 border border-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                  Question Text
                </label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question_text: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={editingQuestion.correct_answer}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correct_answer: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">
                  Explanation
                </label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  onClick={() => setEditingQuestion(null)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton type="submit" variant="primary">
                  [ SAVE CHANGES ]
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* Custom Question Authoring Modal */}
      <CustomQuestionModal
        isOpen={showCustomModal}
        classes={classes}
        defaultClassId={genClassId}
        onClose={() => setShowCustomModal(false)}
        onSuccess={(newQ) => {
          setQuestions((prev) => [newQ, ...prev]);
        }}
      />
    </div>
  );
};
