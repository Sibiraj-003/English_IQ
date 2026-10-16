import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TimetableSlot, SchoolClass, Section, Subject, UserProfile } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Clock, Plus, Trash2, Calendar, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { label: 'Period 1', start: '08:30', end: '09:30' },
  { label: 'Period 2', start: '09:30', end: '10:30' },
  { label: 'Break', start: '10:30', end: '10:45', isBreak: true },
  { label: 'Period 3', start: '10:45', end: '11:45' },
  { label: 'Period 4', start: '11:45', end: '12:45' },
  { label: 'Lunch', start: '12:45', end: '13:30', isBreak: true },
  { label: 'Period 5', start: '13:30', end: '14:30' },
  { label: 'Period 6', start: '14:30', end: '15:30' },
];

export const TimetableManager: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('CLS001');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('09:30');
  const [roomNumber, setRoomNumber] = useState('Room 101');

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, subjList, userList] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getAdminUsers(),
      ]);
      setClasses(classList);
      setSubjects(subjList);
      setTeachers(userList.filter((u) => u.role === 'teacher'));

      if (classList.length > 0) {
        const secList = await api.getSections(selectedClassId || classList[0].id);
        setSections(secList);
        const secId = secList.length > 0 ? secList[0].id : '';
        setSelectedSectionId(secId);
        if (secId) {
          const slotList = await api.getTimetable({ section_id: secId });
          setSlots(slotList);
        }
      }
      if (subjList.length > 0) setSubjectId(subjList[0].id);
      if (userList.filter((u) => u.role === 'teacher').length > 0) {
        setTeacherId(userList.filter((u) => u.role === 'teacher')[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load timetable data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const handleSectionSelect = async (secId: string) => {
    setSelectedSectionId(secId);
    try {
      const slotList = await api.getTimetable({ section_id: secId });
      setSlots(slotList);
    } catch {
      // ignore
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId || !subjectId || !teacherId) return;
    try {
      setSubmitting(true);
      await api.createTimetableSlot({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        subject_id: subjectId,
        teacher_id: teacherId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room_number: roomNumber,
      });
      setFeedback({ type: 'success', message: 'Timetable slot created with conflict validation passed!' });
      setShowAddModal(false);
      const updated = await api.getTimetable({ section_id: selectedSectionId });
      setSlots(updated);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Conflict detected in timetable scheduling' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Remove this schedule slot?')) return;
    try {
      await api.deleteTimetableSlot(id);
      setFeedback({ type: 'success', message: 'Slot removed.' });
      const updated = await api.getTimetable({ section_id: selectedSectionId });
      setSlots(updated);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete slot' });
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Clock className="w-7 h-7" /> Timetable & Conflict Engine
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Automated conflict prevention: checks teacher availability and section time clashes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={() => handleSectionSelect(selectedSectionId)}
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
            ADD SCHEDULE SLOT
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

      {/* Class and Section selectors */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 bg-[#FEFCE8] border-2 border-[#0F172A] text-xs font-bold focus:outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0F172A] uppercase">Section:</span>
          <div className="flex gap-1.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSectionSelect(s.id)}
                className={`px-2.5 py-1 text-xs font-extrabold border-2 border-[#0F172A] transition-all ${
                  selectedSectionId === s.id
                    ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#C4B5FD]'
                    : 'bg-white text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                Section {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable Weekly Grid */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Weekly Class Schedule // Section {sections.find((s) => s.id === selectedSectionId)?.name || '1-A'}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
            CONFLICT_CHECK_ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-bold">
            <thead className="bg-[#C4B5FD] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-2 border-r border-[#0F172A] w-24">Day</th>
                {TIME_SLOTS.map((ts) => (
                  <th key={ts.label} className="p-2 border-r border-[#0F172A]">
                    <div>{ts.label}</div>
                    <div className="text-[9px] opacity-80">{ts.start}-{ts.end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {DAYS.map((day) => (
                <tr key={day} className="hover:bg-slate-50">
                  <td className="p-2 border-r border-[#0F172A] font-black text-[#0F172A] bg-[#F8FAFC]">
                    {day}
                  </td>
                  {TIME_SLOTS.map((ts) => {
                    if (ts.isBreak) {
                      return (
                        <td key={ts.label} className="p-2 border-r border-[#0F172A] bg-slate-100 text-slate-400 text-[10px] font-mono">
                          RECESS
                        </td>
                      );
                    }
                    const matchingSlot = slots.find(
                      (s) => s.day_of_week === day && s.start_time === ts.start
                    );

                    return (
                      <td key={ts.label} className="p-2 border-r border-[#0F172A] align-top">
                        {matchingSlot ? (
                          <div className="p-2 bg-[#FEFCE8] border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-left relative group">
                            <div className="font-black text-[#0F172A] text-[11px] truncate">
                              {matchingSlot.subject_name || matchingSlot.subject_id}
                            </div>
                            <div className="text-[9px] text-slate-600 truncate mt-0.5">
                              {matchingSlot.teacher_name || matchingSlot.teacher_id}
                            </div>
                            <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                              {matchingSlot.room_number || 'Room 101'}
                            </div>
                            <button
                              onClick={() => handleDeleteSlot(matchingSlot.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-rose-700 hover:text-rose-900"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Slot */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Schedule Timetable Period
            </h3>
            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
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
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Teacher (Conflict Checked)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.id_number || t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Room / Lab Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 101, Science Lab 2"
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAddModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={submitting}>
                  {submitting ? 'VALIDATING...' : 'SAVE SLOT'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default TimetableManager;
