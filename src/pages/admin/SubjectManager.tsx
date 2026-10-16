import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subject, SchoolClass } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Layers, Plus, BookOpen, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('Core Academics');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjList, classList] = await Promise.all([
        api.getSubjects(),
        api.getClasses(),
      ]);
      setSubjects(subjList);
      setClasses(classList);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load subjects catalog' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    try {
      setSubmitting(true);
      await api.createSubject({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        department: department.trim(),
        class_ids: selectedClassIds.length > 0 ? selectedClassIds : classes.map((c) => c.id),
      });
      setFeedback({ type: 'success', message: `Subject ${name} created and mapped successfully!` });
      setShowAddModal(false);
      setName('');
      setCode('');
      setSelectedClassIds([]);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create subject' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleClassSelection = (clsId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(clsId) ? prev.filter((id) => id !== clsId) : [...prev, clsId]
    );
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Layers className="w-7 h-7" /> Multi-Subject Academic Catalog
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Dynamic curriculum catalog supporting all disciplines (English, Tamil, Mathematics, Science, Social Science, Hindi, CS, etc.)
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
            ADD NEW SUBJECT
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
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-extrabold uppercase text-[10px]">
            [DISMISS]
          </button>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Total Subjects</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{subjects.length}</div>
        </BrutalCard>
        <BrutalCard size="small" accent="mint" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Active Subjects</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{subjects.filter((s) => s.is_active).length}</div>
        </BrutalCard>
        <BrutalCard size="small" accent="lavender" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Languages & Core</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">10 Disciplines</div>
        </BrutalCard>
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Classes Covered</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{classes.length} Tiers</div>
        </BrutalCard>
      </div>

      {/* Subject List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subj) => (
          <BrutalCard key={subj.id} size="medium" accent="yellow" className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
                <span className="font-black text-base text-[#0F172A] uppercase flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {subj.name}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#FEFCE8] text-[#0F172A] border border-[#0F172A]">
                  CODE: {subj.code}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600">Subject ID:</span>
                  <span className="font-extrabold text-[#0F172A]">{subj.id}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600">Department:</span>
                  <span className="font-extrabold text-[#0F172A]">{subj.department || 'General'}</span>
                </div>
                <div className="bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600 block mb-1">Assigned Classes:</span>
                  <div className="flex flex-wrap gap-1">
                    {subj.class_ids && subj.class_ids.length > 0 ? (
                      subj.class_ids.map((cid: string) => (
                        <span key={cid} className="text-[9px] font-bold px-1.5 py-0.5 bg-[#C4B5FD] border border-[#0F172A]">
                          {cid}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">All Classes (Universal)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#0F172A] flex items-center justify-between text-xs">
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                ACTIVE CATALOG
              </span>
              <span className="text-slate-500 font-bold">School: {subj.school_id}</span>
            </div>
          </BrutalCard>
        ))}
      </div>

      {/* Modal: Add Subject */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-lg p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Add New Academic Subject
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Subject Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics, Tamil, Science, Social Science"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Subject Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MATH, SCI, TAM, ENG"
                    required
                    className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Languages, Sciences, Humanities"
                    className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Assign To Specific Classes (Optional)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#F8FAFC] border-2 border-[#0F172A]">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-1.5 cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(cls.id)}
                        onChange={() => toggleClassSelection(cls.id)}
                      />
                      <span>{cls.name}</span>
                    </label>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Leave all unchecked to automatically map to all school tiers.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAddModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={submitting}>
                  {submitting ? 'SAVING...' : 'CREATE SUBJECT'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default SubjectManager;
