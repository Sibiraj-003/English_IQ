import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Homework } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { BookOpen, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export const ParentHomework: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionId = activeChild?.section_id || 'SEC-1A';
  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';

  const loadHomework = async () => {
    try {
      setLoading(true);
      const res = await api.getHomework({ section_id: sectionId });
      setHomeworkList(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [sectionId]);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <BookOpen className="w-7 h-7" /> Assigned Homework & Academic Tasks
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Track daily coursework, submission deadlines, and teacher feedback for {activeChild?.student_name || 'Child'}
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadHomework}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      {/* Homework Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {homeworkList.map((hw) => {
          const submission = hw.submissions?.find((s) => s.student_id === studentId);
          return (
            <BrutalCard key={hw.id} size="medium" accent="yellow" className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
                  <span className="font-extrabold text-sm text-[#0F172A] uppercase truncate max-w-[180px]">
                    {hw.title}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
                    {hw.subject_name || hw.subject_id}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-2 border border-[#0F172A]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Instructions:</div>
                    <div className="font-bold text-slate-800 line-clamp-2 mt-0.5">{hw.description}</div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 border border-[#0F172A]">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Due Date:
                    </span>
                    <span className="font-mono font-extrabold text-rose-700">{hw.due_date}</span>
                  </div>

                  {/* Submission Status */}
                  <div className="p-2 bg-[#FEFCE8] border border-[#0F172A]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-600">Child's Status:</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border border-[#0F172A] font-extrabold uppercase ${
                          submission?.status === 'graded'
                            ? 'bg-[#A7F3D0] text-[#0F172A]'
                            : submission
                            ? 'bg-[#FDE68A] text-[#0F172A]'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {submission ? submission.status : 'PENDING SUBMISSION'}
                      </span>
                    </div>

                    {submission?.feedback && (
                      <div className="text-[11px] text-slate-700 italic mt-1 pt-1 border-t border-slate-300">
                        Teacher Note: "{submission.feedback}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-[#0F172A] flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Max: {hw.max_marks || 20} pts</span>
                {submission?.marks_obtained !== undefined && (
                  <span className="font-black text-emerald-800 bg-[#A7F3D0] px-2 py-0.5 border border-[#0F172A]">
                    Scored: {submission.marks_obtained}/{hw.max_marks || 20}
                  </span>
                )}
              </div>
            </BrutalCard>
          );
        })}
      </div>
    </div>
  );
};
export default ParentHomework;
