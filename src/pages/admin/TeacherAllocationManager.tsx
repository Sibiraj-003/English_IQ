import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TeacherAssignment, SchoolClass, Section, Subject, UserProfile } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { UserCheck, Plus, Trash2, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const TeacherAllocationManager: React.FC = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('CLS001');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignList, classList, subjectList, userList] = await Promise.all([
        api.getTeacherAssignments(),
        api.getClasses(),
        api.getSubjects(),
        api.getAdminUsers(),
      ]);
      setAssignments(assignList);
      setClasses(classList);
      setSubjects(subjectList);
      setTeachers(userList.filter((u) => u.role === 'teacher'));

      if (classList.length > 0) {
        const secList = await api.getSections(classId || classList[0].id);
        setSections(secList);
        if (secList.length > 0) setSectionId(secList[0].id);
      }
      if (subjectList.length > 0) setSubjectId(subjectList[0].id);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load teacher allocation records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update sections when class selection changes in form
  const handleClassChangeInForm = async (newClassId: string) => {
    setClassId(newClassId);
    try {
      const secList = await api.getSections(newClassId);
      setSections(secList);
      if (secList.length > 0) setSectionId(secList[0].id);
      else setSectionId('');
    } catch {
      // ignore
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !classId || !sectionId || !subjectId) return;
    try {
      setSubmitting(true);
      await api.createTeacherAssignment({
        teacher_id: teacherId,
        class_id: classId,
        section_id: sectionId,
        subject_id: subjectId,
      });
      setFeedback({ type: 'success', message: 'Teacher assigned to section and subject successfully!' });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to allocate teacher' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this academic assignment?')) return;
    try {
      await api.deleteTeacherAssignment(id);
      setFeedback({ type: 'success', message: 'Teacher assignment revoked.' });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove assignment' });
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <UserCheck className="w-7 h-7" /> Teacher Allocation Matrix
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Enforces strict access control: Teacher &rarr; School + Class + Section + Subject
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
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            ASSIGN TEACHER
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

      {/* Security Scope Banner */}
      <BrutalCard size="small" accent="mint" className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-[#0F172A] shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-black text-[#0F172A] uppercase">Zero-Trust Academic Access Boundary</div>
            <p className="text-slate-700 font-bold mt-0.5">
              Teachers can ONLY access student records, tests, homework, and marks within their explicitly allocated Section and Subject (or their Section Mentor assignment). Any unauthorized cross-section requests are rejected with 403 Forbidden by the server.
            </p>
          </div>
        </div>
      </BrutalCard>

      {/* Assignments Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-extrabold uppercase">
          <span>Active Teacher Allocations ({assignments.length})</span>
          <span className="text-[10px] px-2 py-0.5 bg-white border border-[#0F172A]">SERVER_VERIFIED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#FEFCE8] border-b-2 border-[#0F172A] text-[11px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Teacher Name</th>
                <th className="p-3 border-r border-[#0F172A]">Class</th>
                <th className="p-3 border-r border-[#0F172A]">Section</th>
                <th className="p-3 border-r border-[#0F172A]">Subject</th>
                <th className="p-3 border-r border-[#0F172A]">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {assignments.map((as) => (
                <tr key={as.id} className="hover:bg-slate-50">
                  <td className="p-3 border-r border-[#0F172A] font-extrabold text-[#0F172A]">
                    {as.teacher_name || as.teacher_id}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    {as.class_name || as.class_id}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span className="px-2 py-0.5 bg-[#FDE68A] border border-[#0F172A]">
                      {as.section_name || as.section_id}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span className="px-2 py-0.5 bg-[#C4B5FD] border border-[#0F172A]">
                      {as.subject_name || as.subject_id}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] font-extrabold">
                      AUTHORIZED
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteAssignment(as.id)}
                      className="p-1 border border-[#0F172A] bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-[1px_1px_0px_#0F172A]"
                      title="Revoke Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Assignment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="lavender" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Allocate Teacher to Class, Section & Subject
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.id_number || t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Class</label>
                <select
                  value={classId}
                  onChange={(e) => handleClassChangeInForm(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Section --</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name} ({sec.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAddModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={submitting}>
                  {submitting ? 'ALLOCATING...' : 'CONFIRM ALLOCATION'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default TeacherAllocationManager;
