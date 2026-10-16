import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { StudentReportCard } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Award, Printer, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

export const ParentMarks: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [report, setReport] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentReport(studentId);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [studentId]);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A] print:hidden">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Award className="w-7 h-7" /> Academic Performance & Report Card
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Official cumulative report card across all academic subjects and examinations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={loadReport}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            REFRESH
          </BrutalButton>
          <BrutalButton
            variant="primary"
            size="small"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            PRINT REPORT CARD
          </BrutalButton>
        </div>
      </div>

      {/* Printable Official Report Card Document */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] p-6 md:p-8 max-w-4xl mx-auto">
        {/* School Header Banner */}
        <div className="text-center pb-4 border-b-2 border-[#0F172A] mb-6">
          <div className="inline-block p-1 bg-[#C4B5FD] border-2 border-[#0F172A] mb-2 shadow-[2px_2px_0px_#0F172A]">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">
            Oakridge Smart International School
          </h2>
          <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">
            Affiliated to Central Board of Secondary Education // School Code: SCH001
          </p>
          <div className="inline-block px-3 py-1 bg-[#FEFCE8] border border-[#0F172A] text-xs font-black uppercase mt-2">
            ACADEMIC PROGRESS REPORT & SCORE CARD 2026-2027
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F8FAFC] border-2 border-[#0F172A] text-xs font-bold mb-6">
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Student Name:</span>
            <span className="text-sm font-black text-[#0F172A]">
              {report?.student.full_name || activeChild?.student_name || 'Aarav Kumar'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Student ID:</span>
            <span className="font-mono text-sm">{report?.student.id_number || 'STU10001'}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Class & Section:</span>
            <span>{report?.student.class_id || 'Class 1'} // Section {report?.student.section_id || '1-A'}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Attendance Rate:</span>
            <span className="text-emerald-700 font-black">{report?.attendance_percentage || 96}%</span>
          </div>
        </div>

        {/* Cumulative Subject Marks Table */}
        <div className="border-2 border-[#0F172A] mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#FEFCE8] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Subject</th>
                <th className="p-3 border-r border-[#0F172A]">Exam Series</th>
                <th className="p-3 border-r border-[#0F172A] text-center w-24">Marks Obtained</th>
                <th className="p-3 border-r border-[#0F172A] text-center w-24">Max Marks</th>
                <th className="p-3 border-r border-[#0F172A] text-center w-20">Percentage</th>
                <th className="p-3 border-r border-[#0F172A] text-center w-20">Grade</th>
                <th className="p-3">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {report?.marks && report.marks.length > 0 ? (
                report.marks.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 border-r border-[#0F172A] font-extrabold text-[#0F172A]">
                      {m.subject_name || m.subject_id}
                    </td>
                    <td className="p-3 border-r border-[#0F172A]">
                      {m.exam_title || 'Unit Test 1'}
                    </td>
                    <td className="p-3 border-r border-[#0F172A] text-center font-mono font-black">
                      {m.marks_obtained}
                    </td>
                    <td className="p-3 border-r border-[#0F172A] text-center font-mono text-slate-500">
                      {m.max_marks}
                    </td>
                    <td className="p-3 border-r border-[#0F172A] text-center font-mono font-black">
                      {m.percentage}%
                    </td>
                    <td className="p-3 border-r border-[#0F172A] text-center">
                      <span className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[10px] font-black">
                        {m.grade}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 text-[11px] italic">
                      {m.comments || 'Consistent performance'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-bold">
                    No examination marks uploaded yet for this student.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Aggregate Footer */}
            {report && report.marks && report.marks.length > 0 && (
              <tfoot className="bg-[#C4B5FD] border-t-2 border-[#0F172A] text-xs font-black">
                <tr>
                  <td colSpan={2} className="p-3 border-r border-[#0F172A] uppercase">
                    Grand Total & Overall Evaluation:
                  </td>
                  <td className="p-3 border-r border-[#0F172A] text-center font-mono">
                    {report.total_obtained}
                  </td>
                  <td className="p-3 border-r border-[#0F172A] text-center font-mono">
                    {report.total_max}
                  </td>
                  <td className="p-3 border-r border-[#0F172A] text-center font-mono">
                    {report.overall_percentage}%
                  </td>
                  <td className="p-3 border-r border-[#0F172A] text-center bg-[#A7F3D0]">
                    {report.overall_grade}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    Status: <span className="text-emerald-900 uppercase">PROMOTED / EXCELLING</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Grading Scale Reference */}
        <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] mb-8 text-[11px] font-bold">
          <span className="font-black uppercase block mb-1">Grading Scale Reference:</span>
          <div className="flex flex-wrap gap-4 text-slate-700">
            <span>A+ (90-100%): Outstanding</span>
            <span>A (80-89%): Excellent</span>
            <span>B (70-79%): Very Good</span>
            <span>C (60-69%): Good</span>
            <span>D (40-59%): Satisfactory</span>
            <span>F (&lt;40%): Needs Remedial</span>
          </div>
        </div>

        {/* Signatures Row */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs font-black uppercase text-[#0F172A]">
          <div>
            <div className="border-b-2 border-[#0F172A] mb-1 pb-4 text-slate-400 font-normal">
              Mrs. Priya Sharma
            </div>
            <span>Class Teacher / Mentor</span>
          </div>
          <div>
            <div className="border-b-2 border-[#0F172A] mb-1 pb-4 text-slate-400 font-normal">
              Dr. R. K. Narayanan
            </div>
            <span>Academic Dean</span>
          </div>
          <div>
            <div className="border-b-2 border-[#0F172A] mb-1 pb-4 text-slate-400 font-normal">
              Seal & Signature
            </div>
            <span>Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ParentMarks;
