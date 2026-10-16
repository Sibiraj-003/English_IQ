import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Section, Subject, UserProfile, AttendanceRecord, AttendanceStatus } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { CalendarCheck2, CheckCircle, AlertCircle, Save, RefreshCw } from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [secList, subjList, users] = await Promise.all([
        api.getSections(),
        api.getSubjects(),
        api.getAdminUsers(),
      ]);
      setSections(secList);
      setSubjects(subjList);
      const studentUsers = users.filter((u) => u.role === 'student');
      setStudents(studentUsers);

      if (secList.length > 0) {
        setSelectedSectionId(secList[0].id);
      }
      if (subjList.length > 0) {
        setSelectedSubjectId(subjList[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load attendance roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadAttendanceForDate = async () => {
    if (!selectedSectionId || !date) return;
    try {
      const records = await api.getAttendance({
        section_id: selectedSectionId,
        date: date,
        subject_id: selectedSubjectId || undefined,
      });

      const map: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
      records.forEach((r) => {
        map[r.student_id] = { status: r.status, remarks: r.remarks };
      });
      setAttendanceMap(map);

      const sum = await api.getAttendanceSummary(selectedSectionId);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAttendanceForDate();
  }, [selectedSectionId, date, selectedSubjectId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
    students.forEach((s) => {
      updated[s.id] = { status };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId || !date) return;
    try {
      setSaving(true);
      const recordsPayload = students.map((s) => ({
        student_id: s.id,
        status: attendanceMap[s.id]?.status || 'present',
        remarks: attendanceMap[s.id]?.remarks || '',
      }));

      await api.markAttendance({
        section_id: selectedSectionId,
        date: date,
        subject_id: selectedSubjectId || undefined,
        records: recordsPayload,
      });

      setFeedback({
        type: 'success',
        message: 'Daily attendance successfully recorded! Automated notifications dispatched to parents for absent/late students.',
      });
      loadAttendanceForDate();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => (attendanceMap[s.id]?.status || 'present') === 'present').length;
  const absentCount = students.filter((s) => attendanceMap[s.id]?.status === 'absent').length;
  const lateCount = students.filter((s) => attendanceMap[s.id]?.status === 'late').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <CalendarCheck2 className="w-7 h-7" /> Academic Attendance Register
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Section-scoped attendance marking with automated parent notification for absences and late arrivals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={loadAttendanceForDate}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            REFRESH
          </BrutalButton>
          <BrutalButton
            variant="primary"
            size="small"
            onClick={handleSaveAttendance}
            disabled={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? 'RECORDING...' : 'SAVE ATTENDANCE'}
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

      {/* Control Bar: Section, Subject, Date, Mark All */}
      <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-0.5">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="p-1.5 bg-[#FEFCE8] border-2 border-[#0F172A] focus:outline-none"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name} ({s.class_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-0.5">Subject (Optional)</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="p-1.5 bg-[#FEFCE8] border-2 border-[#0F172A] focus:outline-none"
            >
              <option value="">Daily Homeroom Attendance</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-0.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-1.5 bg-white border-2 border-[#0F172A] focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll('present')}
            className="px-2.5 py-1.5 bg-[#A7F3D0] hover:bg-[#86efac] border-2 border-[#0F172A] text-[10px] font-extrabold uppercase shadow-[1.5px_1.5px_0px_#0F172A]"
          >
            MARK ALL PRESENT
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 border-2 border-[#0F172A] text-[10px] font-extrabold uppercase shadow-[1.5px_1.5px_0px_#0F172A]"
          >
            CLEAR ALL
          </button>
        </div>
      </div>

      {/* Roster & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
            <div className="p-3 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
              <span>Section Student Roster ({students.length} students)</span>
              <span className="text-[10px] px-2 py-0.5 bg-white border border-[#0F172A]">
                DATE: {date}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-[#FEFCE8] border-b-2 border-[#0F172A] text-[10px] uppercase">
                  <tr>
                    <th className="p-3 border-r border-[#0F172A]">Student ID</th>
                    <th className="p-3 border-r border-[#0F172A]">Student Name</th>
                    <th className="p-3 border-r border-[#0F172A]">Attendance Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F172A]">
                  {students.map((stu) => {
                    const currentStatus = attendanceMap[stu.id]?.status || 'present';
                    return (
                      <tr key={stu.id} className="hover:bg-slate-50">
                        <td className="p-3 border-r border-[#0F172A] font-mono text-slate-600">
                          {stu.id_number || stu.id}
                        </td>
                        <td className="p-3 border-r border-[#0F172A] font-extrabold text-[#0F172A]">
                          {stu.full_name}
                        </td>
                        <td className="p-3 border-r border-[#0F172A]">
                          <div className="flex items-center gap-1.5">
                            {(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(stu.id, st)}
                                className={`px-2 py-1 border text-[10px] font-black uppercase transition-all ${
                                  currentStatus === st
                                    ? st === 'present'
                                      ? 'bg-[#A7F3D0] border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-[#0F172A]'
                                      : st === 'absent'
                                      ? 'bg-rose-500 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-white'
                                      : st === 'late'
                                      ? 'bg-[#FDE68A] border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-[#0F172A]'
                                      : 'bg-[#C4B5FD] border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-[#0F172A]'
                                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={attendanceMap[stu.id]?.remarks || ''}
                            onChange={(e) =>
                              setAttendanceMap((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  ...(prev[stu.id] || { status: 'present' }),
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            placeholder="Optional note..."
                            className="w-full p-1 border border-[#0F172A] text-[11px] focus:outline-none bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Attendance Summary Side Card */}
        <div className="space-y-4">
          <BrutalCard size="medium" accent="yellow" className="p-4 space-y-3">
            <h3 className="font-black text-xs text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A]">
              Today's Headcount
            </h3>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between p-2 bg-[#A7F3D0] border border-[#0F172A]">
                <span>Present:</span>
                <span className="font-black">{presentCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-rose-100 border border-[#0F172A]">
                <span>Absent:</span>
                <span className="font-black text-rose-800">{absentCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#FDE68A] border border-[#0F172A]">
                <span>Late:</span>
                <span className="font-black">{lateCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-white border border-[#0F172A]">
                <span>Total Roster:</span>
                <span className="font-black">{students.length}</span>
              </div>
            </div>
          </BrutalCard>

          {summary && (
            <BrutalCard size="medium" accent="lavender" className="p-4 space-y-2">
              <h3 className="font-black text-xs text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A]">
                Monthly Section Metric
              </h3>
              <div className="text-2xl font-black text-[#0F172A]">
                {summary.attendance_percentage}%
              </div>
              <div className="text-[10px] text-slate-600 font-bold">
                Average attendance rate across all students in Section this month.
              </div>
            </BrutalCard>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeacherAttendance;
