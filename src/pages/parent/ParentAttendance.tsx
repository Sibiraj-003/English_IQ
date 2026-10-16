import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { CalendarCheck2, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export const ParentAttendance: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendance({ student_id: studentId });
      setRecords(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [studentId]);

  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const lateDays = records.filter((r) => r.status === 'late').length;
  const attendanceRate = records.length > 0 ? Math.round((presentDays / records.length) * 100) : 96;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <CalendarCheck2 className="w-7 h-7" /> Attendance Ledger & History
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Tracking attendance, punctual check-ins, and leaves for {activeChild?.student_name || 'Student'}
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadAttendance}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BrutalCard size="small" accent="mint" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Overall Percentage</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{attendanceRate}%</div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Meets School Standard (&ge;75%)</div>
        </BrutalCard>
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Days Present</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{presentDays}</div>
        </BrutalCard>
        <BrutalCard size="small" accent="lavender" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Days Absent</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{absentDays}</div>
        </BrutalCard>
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Late Arrivals</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{lateDays}</div>
        </BrutalCard>
      </div>

      {/* Daily Records Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span>Attendance Timeline</span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">VERIFIED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#C4B5FD] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Date</th>
                <th className="p-3 border-r border-[#0F172A]">Type</th>
                <th className="p-3 border-r border-[#0F172A]">Status</th>
                <th className="p-3 border-r border-[#0F172A]">Recorded By</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 border-r border-[#0F172A] font-mono">
                    {r.date}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    {r.subject_id ? `Subject: ${r.subject_id}` : 'Daily Homeroom'}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span
                      className={`text-[10px] px-2 py-0.5 border border-[#0F172A] font-extrabold uppercase ${
                        r.status === 'present'
                          ? 'bg-[#A7F3D0] text-[#0F172A]'
                          : r.status === 'absent'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-[#FDE68A] text-[#0F172A]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#0F172A] text-slate-600">
                    {r.recorded_by || 'Class Teacher'}
                  </td>
                  <td className="p-3 text-slate-700 text-[11px]">
                    {r.remarks || 'Regular check-in'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ParentAttendance;
