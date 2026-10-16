import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SchoolClass, Section, UserProfile } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import {
  GraduationCap,
  Layers,
  Plus,
  UserCheck,
  ArrowRightLeft,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const ClassSectionsManager: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('CLS001');
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCapacity, setNewSectionCapacity] = useState('40');

  const [showAssignMentor, setShowAssignMentor] = useState(false);
  const [activeSectionForMentor, setActiveSectionForMentor] = useState<Section | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, sectionList, userList] = await Promise.all([
        api.getClasses(),
        api.getSections(selectedClassId),
        api.getAdminUsers(),
      ]);
      setClasses(classList);
      setSections(sectionList);
      setTeachers(userList.filter((u) => u.role === 'teacher'));
      setStudents(userList.filter((u) => u.role === 'student'));
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load class & section records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    try {
      setActionLoading(true);
      await api.createSection({
        class_id: selectedClassId,
        name: newSectionName.trim(),
        capacity: parseInt(newSectionCapacity) || 40,
      });
      setFeedback({ type: 'success', message: `Section ${newSectionName} created successfully!` });
      setShowAddSection(false);
      setNewSectionName('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create section' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionForMentor || !selectedTeacherId) return;
    try {
      setActionLoading(true);
      await api.assignMentor(activeSectionForMentor.id, selectedTeacherId);
      setFeedback({
        type: 'success',
        message: `Section Mentor assigned to ${activeSectionForMentor.name} successfully!`,
      });
      setShowAssignMentor(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign section mentor' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentId || !targetSectionId) return;
    try {
      setActionLoading(true);
      await api.transferStudent(transferStudentId, targetSectionId, transferReason);
      setFeedback({ type: 'success', message: 'Student transferred to new section successfully!' });
      setShowTransferModal(false);
      setTransferReason('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to transfer student' });
    } finally {
      setActionLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <GraduationCap className="w-7 h-7" /> Classes & Dynamic Sections
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Configure dynamic multi-sections (e.g. 1-A, 1-B, 1-C), section mentors, and student transfers
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
            onClick={() => setShowAddSection(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            ADD NEW SECTION
          </BrutalButton>
          <BrutalButton
            variant="secondary"
            size="small"
            onClick={() => setShowTransferModal(true)}
            icon={<ArrowRightLeft className="w-4 h-4" />}
          >
            TRANSFER STUDENT
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

      {/* Class Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-slate-200">
        <span className="text-xs font-extrabold text-[#0F172A] uppercase mr-2 flex items-center gap-1">
          <Layers className="w-4 h-4" /> Select Class:
        </span>
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-3 py-1.5 border-2 border-[#0F172A] text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedClassId === cls.id
                ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Active Class Info Banner */}
      <BrutalCard size="small" accent="lavender" className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-600">Selected Academic Tier</div>
            <div className="text-lg font-black text-[#0F172A]">{selectedClass?.name || 'Class'}</div>
            <div className="text-xs text-slate-700 font-bold">{selectedClass?.description}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A]">
              Sections: {sections.length}
            </span>
            <span className="px-2.5 py-1 bg-[#A7F3D0] border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A]">
              Total Capacity: {sections.reduce((acc, s) => acc + (s.capacity || 40), 0)}
            </span>
          </div>
        </div>
      </BrutalCard>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <BrutalCard key={sec.id} size="medium" accent="yellow" className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
                <span className="font-black text-lg text-[#0F172A] uppercase">Section {sec.name}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600">Section ID:</span>
                  <span className="font-extrabold text-[#0F172A]">{sec.id}</span>
                </div>

                <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                  <span className="font-bold text-slate-600">Student Capacity:</span>
                  <span className="font-extrabold text-[#0F172A]">{sec.capacity || 40} seats</span>
                </div>

                <div className="bg-white p-2 border border-[#0F172A]">
                  <div className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Section Mentor (Class Teacher):</div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#0F172A]">
                      {sec.mentor_name ? sec.mentor_name : 'No Mentor Assigned'}
                    </span>
                    <button
                      onClick={() => {
                        setActiveSectionForMentor(sec);
                        setSelectedTeacherId(sec.mentor_id || '');
                        setShowAssignMentor(true);
                      }}
                      className="text-[10px] font-extrabold px-2 py-1 bg-[#FDE68A] hover:bg-[#FCD34D] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A]"
                    >
                      {sec.mentor_id ? 'CHANGE' : 'ASSIGN'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#0F172A] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">School ID: {sec.school_id}</span>
              <span className="text-[10px] font-bold text-[#0F172A] bg-white px-2 py-0.5 border border-[#0F172A]">
                Full Isolation Enforced
              </span>
            </div>
          </BrutalCard>
        ))}
      </div>

      {sections.length === 0 && !loading && (
        <div className="p-8 border-2 border-[#0F172A] bg-white text-center shadow-[4px_4px_0px_#0F172A]">
          <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <h3 className="font-black text-sm text-[#0F172A] uppercase">No Sections Configured for this Class</h3>
          <p className="text-xs text-slate-600 mt-1 mb-4">Click below to create dynamic sections like 1-A, 1-B, etc.</p>
          <BrutalButton variant="primary" size="small" onClick={() => setShowAddSection(true)}>
            + Create First Section
          </BrutalButton>
        </div>
      )}

      {/* Modal: Add Section */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="lavender" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Add New Section to {selectedClass?.name}
            </h3>
            <form onSubmit={handleCreateSection} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Section Name (e.g. 1-A, 1-B, 1-C)</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. 1-C"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Student Capacity</label>
                <input
                  type="number"
                  value={newSectionCapacity}
                  onChange={(e) => setNewSectionCapacity(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAddSection(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={actionLoading}>
                  {actionLoading ? 'CREATING...' : 'CREATE SECTION'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* Modal: Assign Mentor */}
      {showAssignMentor && activeSectionForMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Assign Section Mentor // {activeSectionForMentor.name}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-bold">
              The Section Mentor gets complete academic visibility (attendance, all subjects, all marks, homework, reports) across Section {activeSectionForMentor.name}.
            </p>
            <form onSubmit={handleAssignMentor} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Authorized Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.id_number || t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAssignMentor(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={actionLoading}>
                  {actionLoading ? 'SAVING...' : 'CONFIRM MENTOR'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* Modal: Transfer Student */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="mint" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Transfer Student Between Sections
            </h3>
            <form onSubmit={handleTransferStudent} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Student</label>
                <select
                  value={transferStudentId}
                  onChange={(e) => setTransferStudentId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Student to Transfer --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.id_number || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Target Section</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Target Section --</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name} ({sec.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Reason for Transfer (Audit Trail)</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Academic rebalancing or parent request"
                  className="w-full p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowTransferModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={actionLoading}>
                  {actionLoading ? 'TRANSFERRING...' : 'CONFIRM TRANSFER'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default ClassSectionsManager;
