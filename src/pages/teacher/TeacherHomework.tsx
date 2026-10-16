import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Homework, Section, Subject, SchoolClass } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { BookOpen, Plus, CheckCircle, AlertCircle, Clock, FileText, Check, RefreshCw } from 'lucide-react';

export const TeacherHomework: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Homework Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classId, setClassId] = useState('CLS001');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [maxMarks, setMaxMarks] = useState('25');
  const [submitting, setSubmitting] = useState(false);

  // Review Submissions Modal
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [marksGiven, setMarksGiven] = useState('23');
  const [evalFeedback, setEvalFeedback] = useState('Excellent execution and neat presentation.');

  const loadData = async () => {
    try {
      setLoading(true);
      const [hw, secList, subjList, classList] = await Promise.all([
        api.getHomework(),
        api.getSections(),
        api.getSubjects(),
        api.getClasses(),
      ]);
      setHomeworkList(hw);
      setSections(secList);
      setSubjects(subjList);
      setClasses(classList);

      if (secList.length > 0) setSectionId(secList[0].id);
      if (subjList.length > 0) setSubjectId(subjList[0].id);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load homework assignments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sectionId || !subjectId) return;
    try {
      setSubmitting(true);
      await api.createHomework({
        class_id: classId,
        section_id: sectionId,
        subject_id: subjectId,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        due_date: dueDate,
        max_marks: parseInt(maxMarks) || 20,
      });

      setFeedback({
        type: 'success',
        message: 'Homework task posted successfully! Relevant students & parents notified.',
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create homework' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;
    try {
      await api.evaluateHomework(selectedSubmissionId, {
        status: 'graded',
        marks_obtained: parseFloat(marksGiven),
        feedback: evalFeedback,
      });
      setFeedback({ type: 'success', message: 'Submission evaluated and student report updated!' });
      setSelectedSubmissionId('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to evaluate submission' });
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <BookOpen className="w-7 h-7" /> Homework & Tasks Hub
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Publish academic assignments, review submissions, and return constructive feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={loadData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            REFRESH
          </BrutalButton>
          <BrutalButton
            variant="primary"
            size="small"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            POST HOMEWORK
          </BrutalButton>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 border-2 border-[#0F172A] text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#0F172A] ${
            feedback.type === 'success' ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-rose-100 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-extrabold uppercase text-[10px]">
            [DISMISS]
          </button>
        </div>
      )}

      {/* Homework Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {homeworkList.map((hw) => (
          <BrutalCard key={hw.id} size="medium" accent="yellow" className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
                <span className="font-extrabold text-sm text-[#0F172A] uppercase truncate max-w-[180px]">
                  {hw.title}
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
                  {hw.subject_name || hw.subject_id}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600">Assigned To:</span>
                  <span className="font-extrabold text-[#0F172A]">
                    {hw.class_name} // Section {hw.section_name || hw.section_id}
                  </span>
                </div>

                <div className="bg-white p-2 border border-[#0F172A]">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Brief:</div>
                  <div className="font-bold text-slate-800 line-clamp-2 mt-0.5">{hw.description}</div>
                </div>

                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due Date:
                  </span>
                  <span className="font-mono font-extrabold text-rose-700">{hw.due_date}</span>
                </div>

                <div className="flex justify-between items-center bg-[#FEFCE8] p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-700">Submissions:</span>
                  <span className="font-extrabold text-[#0F172A]">
                    {hw.submissions ? hw.submissions.length : 0} Turn-ins
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#0F172A] flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">Max: {hw.max_marks || 20} pts</span>
              <button
                onClick={() => setActiveHomework(hw)}
                className="px-2.5 py-1 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#FDE68A]"
              >
                SUBMISSIONS & GRADING
              </button>
            </div>
          </BrutalCard>
        ))}
      </div>

      {homeworkList.length === 0 && !loading && (
        <div className="p-8 border-2 border-[#0F172A] bg-white text-center shadow-[4px_4px_0px_#0F172A]">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <h3 className="font-black text-sm text-[#0F172A] uppercase">No Homework Assigned Yet</h3>
          <p className="text-xs text-slate-600 mt-1 mb-4">Click below to post an assignment to your authorized sections.</p>
          <BrutalButton variant="primary" size="small" onClick={() => setShowCreateModal(true)}>
            + Create Homework
          </BrutalButton>
        </div>
      )}

      {/* Submissions & Grading Drawer Modal */}
      {activeHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
              <div>
                <h3 className="text-base font-black text-[#0F172A] uppercase">
                  Submissions // {activeHomework.title}
                </h3>
                <span className="text-xs font-bold text-slate-600">
                  Section {activeHomework.section_name} &bull; {activeHomework.subject_name}
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveHomework(null);
                  setSelectedSubmissionId('');
                }}
                className="px-2 py-1 border border-[#0F172A] bg-slate-100 text-xs font-bold uppercase"
              >
                CLOSE
              </button>
            </div>

            {/* Submissions list */}
            <div className="space-y-3 mb-6">
              {activeHomework.submissions && activeHomework.submissions.length > 0 ? (
                activeHomework.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 border-2 border-[#0F172A] text-xs transition-all ${
                      selectedSubmissionId === sub.id ? 'bg-[#FEFCE8] shadow-[2px_2px_0px_#0F172A]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-[#0F172A]">{sub.student_name || sub.student_id}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border border-[#0F172A] font-extrabold uppercase ${
                          sub.status === 'graded' ? 'bg-[#A7F3D0]' : 'bg-[#FDE68A]'
                        }`}
                      >
                        {sub.status === 'graded' ? `GRADED (${sub.marks_obtained}/${activeHomework.max_marks})` : 'SUBMITTED'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-300 font-mono text-[11px] mb-2">
                      {sub.submission_text || 'Submitted coursework files.'}
                    </div>

                    {sub.feedback && (
                      <div className="text-[10px] text-slate-600 mb-2 italic">
                        Feedback: "{sub.feedback}"
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedSubmissionId(sub.id);
                        setMarksGiven(String(sub.marks_obtained || activeHomework.max_marks || 20));
                        setEvalFeedback(sub.feedback || 'Good work.');
                      }}
                      className="px-2 py-1 bg-[#0F172A] text-white text-[10px] font-black uppercase"
                    >
                      {sub.status === 'graded' ? 'EDIT GRADE' : 'GRADE SUBMISSION'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-slate-50 border-2 border-dashed border-[#0F172A] text-center text-xs text-slate-500 font-bold">
                  No student turn-ins recorded yet.
                </div>
              )}
            </div>

            {/* Grading Form */}
            {selectedSubmissionId && (
              <form onSubmit={handleEvaluate} className="p-4 bg-[#A7F3D0] border-2 border-[#0F172A] space-y-3 text-xs font-bold">
                <h4 className="font-black text-xs text-[#0F172A] uppercase">
                  Evaluation & Feedback Form
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#0F172A] mb-1 uppercase">Marks (Max: {activeHomework.max_marks || 25})</label>
                    <input
                      type="number"
                      value={marksGiven}
                      onChange={(e) => setMarksGiven(e.target.value)}
                      max={activeHomework.max_marks || 100}
                      min="0"
                      required
                      className="w-full p-2 bg-white border border-[#0F172A] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0F172A] mb-1 uppercase">Teacher Feedback</label>
                    <input
                      type="text"
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                      placeholder="Feedback for student..."
                      className="w-full p-2 bg-white border border-[#0F172A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmissionId('')}
                    className="px-2.5 py-1 bg-white border border-[#0F172A] text-[10px] font-extrabold uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#0F172A] text-white text-[10px] font-extrabold uppercase shadow-[1.5px_1.5px_0px_#FDE68A]"
                  >
                    SUBMIT GRADE
                  </button>
                </div>
              </form>
            )}
          </BrutalCard>
        </div>
      )}

      {/* Modal: Create Homework */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="lavender" className="w-full max-w-lg p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Create New Homework Task
            </h3>
            <form onSubmit={handleCreateHomework} className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Section</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    required
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name} ({s.class_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 Exercise & Summary"
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Description / Overview</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Write clear instructions for students..."
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Max Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    required
                    min="1"
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowCreateModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={submitting}>
                  {submitting ? 'POSTING...' : 'PUBLISH HOMEWORK'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default TeacherHomework;
