import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { TimetableSlot } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Clock, Calendar, RefreshCw } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { label: 'Period 1', start: '08:30', end: '09:30' },
  { label: 'Period 2', start: '09:30', end: '10:30' },
  { label: 'Recess', start: '10:30', end: '10:45', isBreak: true },
  { label: 'Period 3', start: '10:45', end: '11:45' },
  { label: 'Period 4', start: '11:45', end: '12:45' },
  { label: 'Lunch', start: '12:45', end: '13:30', isBreak: true },
  { label: 'Period 5', start: '13:30', end: '14:30' },
  { label: 'Period 6', start: '14:30', end: '15:30' },
];

export const ParentTimetable: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionId = activeChild?.section_id || 'SEC-1A';

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.getTimetable({ section_id: sectionId });
      setSlots(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [sectionId]);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Clock className="w-7 h-7" /> Class Timetable & Routine
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Weekly academic schedule for Section {activeChild?.section_name || '1-A'} ({activeChild?.student_name})
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadTimetable}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Weekly Class Schedule
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
            CURRENT_TERM
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
                          BREAK
                        </td>
                      );
                    }
                    const matchingSlot = slots.find(
                      (s) => s.day_of_week === day && s.start_time === ts.start
                    );

                    return (
                      <td key={ts.label} className="p-2 border-r border-[#0F172A] align-top">
                        {matchingSlot ? (
                          <div className="p-2 bg-[#FEFCE8] border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-left">
                            <div className="font-black text-[#0F172A] text-[11px] truncate">
                              {matchingSlot.subject_name || matchingSlot.subject_id}
                            </div>
                            <div className="text-[9px] text-slate-600 truncate mt-0.5">
                              {matchingSlot.teacher_name}
                            </div>
                            <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                              {matchingSlot.room_number || 'Room 101'}
                            </div>
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
    </div>
  );
};
export default ParentTimetable;
