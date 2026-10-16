import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { AttendanceRecord, Homework, StudentFeeRecord, SchoolNotification, TimetableSlot } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import {
  Users,
  CalendarCheck2,
  BookOpen,
  Award,
  DollarSign,
  Clock,
  Bell,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ParentDashboard: React.FC = () => {
  const { user, activeChild, selectChild } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [feeRecord, setFeeRecord] = useState<StudentFeeRecord | null>(null);
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';
  const sectionId = activeChild?.section_id || 'SEC-1A';

  const loadChildData = async () => {
    try {
      setLoading(true);
      const [att, hw, fees, notifs, sched] = await Promise.all([
        api.getAttendance({ student_id: studentId }),
        api.getHomework({ section_id: sectionId }),
        api.getStudentFees({ student_id: studentId }),
        api.getNotifications({ target_role: 'parent' }),
        api.getTimetable({ section_id: sectionId, day_of_week: 'Monday' }),
      ]);
      setAttendance(att);
      setHomework(hw);
      if (fees && fees.length > 0) setFeeRecord(fees[0]);
      setNotifications(notifs);
      setTodaySchedule(sched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildData();
  }, [studentId, sectionId]);

  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const attendancePct = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 96;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner / Child Switcher */}
      <div className="bg-[#FEFCE8] border-2 border-[#0F172A] p-4 shadow-[4px_4px_0px_#0F172A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C4B5FD] border-2 border-[#0F172A] flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#0F172A]">
              {activeChild?.student_name.charAt(0) || 'A'}
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-500">Student Profile</div>
              <h1 className="text-xl font-black text-[#0F172A] uppercase">
                {activeChild?.student_name || 'Aarav Kumar'}
              </h1>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mt-0.5">
                <span className="px-1.5 py-0.2 bg-white border border-[#0F172A]">
                  ID: {activeChild?.id_number || 'STU10001'}
                </span>
                <span className="px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
                  {activeChild?.class_name || 'Class 1'} &bull; Section {activeChild?.section_name || '1-A'}
                </span>
              </div>
            </div>
          </div>

          {/* Child Switcher Pills if parent has multiple kids */}
          {user?.children && user.children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-slate-600">Switch Child:</span>
              <div className="flex gap-1.5">
                {user.children.map((c) => (
                  <button
                    key={c.student_id}
                    onClick={() => selectChild(c.student_id)}
                    className={`px-3 py-1.5 border-2 border-[#0F172A] text-xs font-extrabold uppercase transition-all ${
                      activeChild?.student_id === c.student_id
                        ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                        : 'bg-white text-[#0F172A] hover:bg-slate-100'
                    }`}
                  >
                    {c.student_name} ({c.section_name})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BrutalCard size="small" accent="mint" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-600">Attendance</span>
            <CalendarCheck2 className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{attendancePct}%</div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Excellent Attendance</div>
        </BrutalCard>

        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-600">Recent Result</span>
            <Award className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">Grade A+</div>
          <div className="text-[10px] text-slate-600 font-bold mt-0.5">Rank #1 in Section 1-A</div>
        </BrutalCard>

        <BrutalCard size="small" accent="lavender" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-600">Active Homework</span>
            <BookOpen className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{homework.length} Tasks</div>
          <div className="text-[10px] text-indigo-800 font-bold mt-0.5">English & Mathematics</div>
        </BrutalCard>

        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-600">Fee Status</span>
            <DollarSign className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">
            {feeRecord ? `₹${feeRecord.pending_amount}` : '₹0'}
          </div>
          <div className="text-[10px] text-slate-600 font-bold mt-0.5">
            {feeRecord?.status === 'paid' ? 'All dues cleared' : 'Due by Nov 30'}
          </div>
        </BrutalCard>
      </div>

      {/* Main Grid: Today's Schedule & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <BrutalCard size="medium" accent="yellow" className="p-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
              <span className="font-black text-xs text-[#0F172A] uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Today's Timetable Schedule
              </span>
              <Link
                to="/parent/timetable"
                className="text-[10px] font-extrabold uppercase text-[#0F172A] underline hover:bg-[#FDE68A] px-1"
              >
                FULL WEEK SCHEDULE &rarr;
              </Link>
            </div>

            <div className="space-y-2">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 bg-white border-2 border-[#0F172A] flex items-center justify-between text-xs font-bold shadow-[2px_2px_0px_#0F172A]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 text-[11px] w-24">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <div>
                        <div className="font-extrabold text-[#0F172A]">{slot.subject_name || slot.subject_id}</div>
                        <div className="text-[10px] text-slate-500">{slot.teacher_name}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FEFCE8] border border-[#0F172A]">
                      {slot.room_number || 'Room 101'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-slate-50 border-2 border-dashed border-[#0F172A] text-center text-xs text-slate-500 font-bold">
                  No classes scheduled for today.
                </div>
              )}
            </div>
          </BrutalCard>

          {/* Quick Academic Hub Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/parent/marks"
              className="p-3 bg-white border-2 border-[#0F172A] text-center shadow-[3px_3px_0px_#0F172A] hover:bg-[#FDE68A] transition-all"
            >
              <Award className="w-5 h-5 mx-auto mb-1 text-[#0F172A]" />
              <div className="text-xs font-black uppercase">Report Card</div>
            </Link>

            <Link
              to="/parent/attendance"
              className="p-3 bg-white border-2 border-[#0F172A] text-center shadow-[3px_3px_0px_#0F172A] hover:bg-[#A7F3D0] transition-all"
            >
              <CalendarCheck2 className="w-5 h-5 mx-auto mb-1 text-[#0F172A]" />
              <div className="text-xs font-black uppercase">Attendance</div>
            </Link>

            <Link
              to="/parent/homework"
              className="p-3 bg-white border-2 border-[#0F172A] text-center shadow-[3px_3px_0px_#0F172A] hover:bg-[#C4B5FD] transition-all"
            >
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-[#0F172A]" />
              <div className="text-xs font-black uppercase">Homework</div>
            </Link>

            <Link
              to="/parent/messages"
              className="p-3 bg-white border-2 border-[#0F172A] text-center shadow-[3px_3px_0px_#0F172A] hover:bg-[#FEFCE8] transition-all"
            >
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-[#0F172A]" />
              <div className="text-xs font-black uppercase">Teacher Chat</div>
            </Link>
          </div>
        </div>

        {/* School Announcements */}
        <div>
          <BrutalCard size="medium" accent="lavender" className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A]">
              <span className="font-black text-xs text-[#0F172A] uppercase flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Announcements & Alerts
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
                REALTIME
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 bg-white border-2 border-[#0F172A] text-xs shadow-[2px_2px_0px_#0F172A]">
                  <div className="font-extrabold text-[#0F172A] mb-1">{n.title}</div>
                  <div className="text-slate-700 text-[11px] leading-relaxed font-bold">{n.message}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </BrutalCard>
        </div>
      </div>
    </div>
  );
};
export default ParentDashboard;
