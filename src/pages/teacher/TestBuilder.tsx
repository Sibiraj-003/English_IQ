import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { api } from '../../services/api';
import { Test, Question, SchoolClass } from '../../types';
import { FilePlus2, ListChecks, Clock, Check, Plus, AlertCircle, CheckCheck, BarChart3 } from 'lucide-react';

export const TestBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [targetClassId, setTargetClassId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [publishImmediate, setPublishImmediate] = useState(true);

  const loadData = async () => {
    try {
      const [tList, qList, cList] = await Promise.all([
        api.getTests(),
        api.getQuestions(),
        api.getClasses(),
      ]);
      setTests(tList);
      setQuestions(qList);
      setClasses(cList);
      if (cList.length > 0 && !targetClassId) {
        setTargetClassId(cList[0].id);
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

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qid) => qid !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedQuestionIds.length === 0) {
      alert('Please provide a title and select at least one question.');
      return;
    }

    try {
      await api.createTest({
        class_id: targetClassId || (classes[0]?.id || ''),
        title,
        description,
        duration_minutes: duration,
        total_questions: selectedQuestionIds.length,
        question_ids: selectedQuestionIds,
        published: publishImmediate,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedQuestionIds([]);
      loadData();
    } catch (err: any) {
      alert(`Error creating test: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#BAE6FD] text-[#0F172A] border border-[#0F172A]">
            ASSESSMENT_BUILDER // TEST_COMPILER
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Test Builder & Assessment Registry
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Assemble, time, and publish curriculum examinations using approved questions from the Question Bank.
          </p>
        </div>

        <BrutalButton
          variant="mint"
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          + CREATE NEW TEST
        </BrutalButton>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <EmptyState
          label="TEST_BUILDER // EMPTY"
          title="NO TESTS CREATED YET"
          description="Build and publish curriculum tests using approved questions from your question bank."
          actionText="CREATE NEW TEST"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const assignedClass = classes.find((c) => c.id === test.class_id);
            const totalEnrolled = test.total_enrolled ?? (assignedClass?.students_count || 1);
            const submissionsCount = test.submissions_count ?? 0;
            const allCompleted = test.all_students_completed || (totalEnrolled > 0 && submissionsCount >= totalEnrolled);

            return (
              <BrutalCard key={test.id} size="normal" accent={allCompleted ? 'mint' : 'sky'} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white uppercase">
                      {assignedClass?.name || 'CLASS ASSESSMENT'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {allCompleted ? (
                        <span className="px-2 py-0.5 bg-emerald-200 border border-emerald-900 text-emerald-950 text-[10px] font-extrabold flex items-center gap-1 shadow-[1px_1px_0px_#0F172A]">
                          <CheckCheck className="w-3.5 h-3.5 stroke-[3] text-emerald-800" />
                          ALL STUDENTS COMPLETED
                        </span>
                      ) : submissionsCount > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-900 text-amber-950 text-[10px] font-extrabold">
                          {submissionsCount}/{totalEnrolled} COMPLETED
                        </span>
                      ) : null}
                      <Badge variant={test.published ? 'mint' : 'amber'}>
                        {test.published ? 'PUBLISHED' : 'DRAFT'}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#0F172A] font-sans mb-1">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans mb-4">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAFC] border-2 border-[#0F172A] mb-4 text-xs text-center font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-[#0F172A]" />
                      <span>{test.total_questions || test.question_ids?.length || 0} QUESTIONS</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 border-l-2 border-slate-200">
                      <Clock className="w-4 h-4 text-[#0F172A]" />
                      <span>{test.duration_minutes || 15} MINUTES</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                  <span className="text-[11px] text-slate-600 font-bold">
                    {submissionsCount} / {totalEnrolled} STUDENTS SUBMITTED
                  </span>
                  <BrutalButton
                    variant={allCompleted ? 'mint' : 'white'}
                    size="sm"
                    onClick={() => navigate('/teacher/analytics')}
                    icon={<BarChart3 className="w-3.5 h-3.5" />}
                  >
                    {allCompleted ? '[ EVALUATED REPORT ]' : '[ ANALYTICS ]'}
                  </BrutalButton>
                </div>
              </BrutalCard>
            );
          })}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <BrutalCard size="large" accent="lavender" className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
              <span className="font-extrabold text-sm text-[#0F172A]">NEW_TEST // COMPILER</span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="font-bold text-xs px-2 py-0.5 border border-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Target Class</label>
                  <select
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Test Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 1 Grammar Assessment"
                  required
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Evaluates reading comprehension and naming words"
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  min={5}
                  max={120}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold"
                />
              </div>

              {/* Question Picker List */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase flex justify-between">
                  <span>Select Questions ({selectedQuestionIds.length} Selected)</span>
                  <span className="text-slate-500 font-normal">Approved & Published Bank</span>
                </label>

                {questions.length === 0 ? (
                  <div className="p-4 bg-slate-100 border border-[#0F172A] text-xs text-slate-500 text-center">
                    No questions available. Generate or approve questions in the Question Bank first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto border-2 border-[#0F172A] p-2 bg-[#F8FAFC]">
                    {questions.map((q) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-2.5 border border-[#0F172A] text-xs font-bold cursor-pointer transition-all flex items-start gap-2 ${
                            isSelected ? 'bg-[#A7F3D0] shadow-[1px_1px_0px_#0F172A]' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mt-0.5 accent-[#0F172A]"
                          />
                          <div className="flex-1">
                            <div className="text-[10px] text-slate-500 uppercase">
                              [{q.question_type}] • Topic: {q.topic} • Status: {q.status}
                            </div>
                            <div className="text-[#0F172A] font-sans text-xs line-clamp-2">
                              {q.question_text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publish"
                  checked={publishImmediate}
                  onChange={(e) => setPublishImmediate(e.target.checked)}
                  className="accent-[#0F172A] w-4 h-4"
                />
                <label htmlFor="publish" className="text-xs font-bold text-[#0F172A] cursor-pointer">
                  PUBLISH IMMEDIATELY (Make visible to student test center)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  onClick={() => setShowCreateModal(false)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton type="submit" variant="primary">
                  [ COMPILE & SAVE TEST ]
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
