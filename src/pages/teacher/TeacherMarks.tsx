import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Exam, Section, Subject, UserProfile, MarkEntry } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Award, Save, CheckCircle, AlertCircle, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';

export const TeacherMarks: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, { marks_obtained: string; max_marks: string; comments?: string }>>({});
  const [existingMarks, setExistingMarks] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [examList, secList, subjList, users] = await Promise.all([
        api.getExams(),
        api.getSections(),
        api.getSubjects(),
        api.getAdminUsers(),
      ]);
      setExams(examList);
      setSections(secList);
      setSubjects(subjList);
      setStudents(users.filter((u) => u.role === 'student'));

      if (examList.length > 0) setSelectedExamId(examList[0].id);
      if (secList.length > 0) setSelectedSectionId(secList[0].id);
      if (subjList.length > 0) setSelectedSubjectId(subjList[0].id);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load examination catalog' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadExamMarks = async () => {
    if (!selectedExamId || !selectedSectionId || !selectedSubjectId) return;
    try {
      const marksData = await api.getExamMarks(selectedExamId, {
        section_id: selectedSectionId,
        subject_id: selectedSubjectId,
      });
      setExistingMarks(marksData);

      const map: Record<string, { marks_obtained: string; max_marks: string; comments?: string }> = {};
      marksData.forEach((m) => {
        map[m.student_id] = {
          marks_obtained: String(m.marks_obtained),
          max_marks: String(m.max_marks || 100),
          comments: m.comments || '',
        };
      });
      setMarksMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExamMarks();
  }, [selectedExamId, selectedSectionId, selectedSubjectId]);

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { max_marks: '100' }),
        marks_obtained: val,
      },
    }));
  };

  const calculateGrade = (pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSectionId || !selectedSubjectId) return;
    try {
      setSaving(true);
      const marksPayload = students
        .filter((s) => marksMap[s.id]?.marks_obtained !== undefined)
        .map((s) => ({
          student_id: s.id,
          marks_obtained: parseFloat(marksMap[s.id]?.marks_obtained || '0'),
          max_marks: parseFloat(marksMap[s.id]?.max_marks || '100'),
          comments: marksMap[s.id]?.comments || '',
        }));

      await api.enterExamMarks({
        exam_id: selectedExamId,
        section_id: selectedSectionId,
        subject_id: selectedSubjectId,
        marks: marksPayload,
      });

      setFeedback({
        type: 'success',
        message: 'Exam marks, automated grades, and rankings saved successfully!',
      });
      loadExamMarks();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save marks' });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const filledEntries = students.map((s) => {
    const obtained = parseFloat(marksMap[s.id]?.marks_obtained || '0');
    const max = parseFloat(marksMap[s.id]?.max_marks || '100');
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    return { student: s, obtained, max, pct, grade: calculateGrade(pct) };
  });

  const avgPct =
    filledEntries.length > 0
      ? Math.round(filledEntries.reduce((acc, e) => acc + e.pct, 0) / filledEntries.length)
      : 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Award className="w-7 h-7" /> Examination & Academic Marks Ledger
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Teacher marks entry, automated percentage & grade calculation (A+, A, B, C, D), and student rankings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={loadExamMarks}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            REFRESH
          </BrutalButton>
          <BrutalButton
            variant="primary"
            size="small"
            onClick={handleSaveMarks}
            disabled={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? 'RECORDING...' : 'PUBLISH & SAVE MARKS'}
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

      {/* Selectors */}
      <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-0.5">Exam Series</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="p-1.5 bg-[#FEFCE8] border-2 border-[#0F172A] focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.exam_type})
                </option>
              ))}
            </select>
          </div>

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
            <label className="block text-[10px] uppercase text-slate-500 mb-0.5">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="p-1.5 bg-[#FEFCE8] border-2 border-[#0F172A] focus:outline-none"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Class Average</span>
            <span className="text-base font-black text-emerald-700">{avgPct}%</span>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span>Student Score Sheet ({students.length} candidates)</span>
          <span className="text-[10px] px-2 py-0.5 bg-white border border-[#0F172A]">
            MAX MARKS: 100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#FEFCE8] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Student ID</th>
                <th className="p-3 border-r border-[#0F172A]">Student Name</th>
                <th className="p-3 border-r border-[#0F172A] w-32">Marks Obtained</th>
                <th className="p-3 border-r border-[#0F172A] w-24">Percentage</th>
                <th className="p-3 border-r border-[#0F172A] w-20">Grade</th>
                <th className="p-3">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {students.map((stu) => {
                const obtained = parseFloat(marksMap[stu.id]?.marks_obtained || '0');
                const max = parseFloat(marksMap[stu.id]?.max_marks || '100');
                const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
                const grade = calculateGrade(pct);

                return (
                  <tr key={stu.id} className="hover:bg-slate-50">
                    <td className="p-3 border-r border-[#0F172A] font-mono text-slate-600">
                      {stu.id_number || stu.id}
                    </td>
                    <td className="p-3 border-r border-[#0F172A] font-extrabold text-[#0F172A]">
                      {stu.full_name}
                    </td>
                    <td className="p-3 border-r border-[#0F172A]">
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          value={marksMap[stu.id]?.marks_obtained || ''}
                          onChange={(e) => handleMarkChange(stu.id, e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-16 p-1.5 border-2 border-[#0F172A] text-xs font-black text-center bg-white shadow-[1px_1px_0px_#0F172A] focus:outline-none"
                        />
                        <span className="text-slate-400">/ 100</span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-[#0F172A] font-mono font-black">
                      {marksMap[stu.id]?.marks_obtained ? `${pct}%` : '-'}
                    </td>
                    <td className="p-3 border-r border-[#0F172A]">
                      {marksMap[stu.id]?.marks_obtained ? (
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 border border-[#0F172A] ${
                            grade.startsWith('A')
                              ? 'bg-[#A7F3D0] text-[#0F172A]'
                              : grade === 'B'
                              ? 'bg-[#FDE68A] text-[#0F172A]'
                              : grade === 'C'
                              ? 'bg-[#C4B5FD] text-[#0F172A]'
                              : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          {grade}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={marksMap[stu.id]?.comments || ''}
                        onChange={(e) =>
                          setMarksMap((prev) => ({
                            ...prev,
                            [stu.id]: {
                              ...(prev[stu.id] || { marks_obtained: '0', max_marks: '100' }),
                              comments: e.target.value,
                            },
                          }))
                        }
                        placeholder="Academic feedback..."
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
  );
};
export default TeacherMarks;
