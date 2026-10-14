import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { SchoolClass } from '../../types';
import { GraduationCap, Plus, BookOpen, Users, TrendingUp, ArrowRight, Trash2 } from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(6);
  const [newClassDesc, setNewClassDesc] = useState('');

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await api.createClass(newClassName, newClassGrade, newClassDesc);
      setShowModal(false);
      setNewClassName('');
      loadClasses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
            CLASS_REGISTRY // DIRECTORY
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-sans mt-1">
            School Class Management
          </h2>
          <p className="text-xs text-slate-600 font-mono mt-0.5">
            Strict curriculum isolation is enforced per class. Select a class to inspect books and student records.
          </p>
        </div>

        <BrutalButton
          variant="lavender"
          onClick={() => setShowModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          + CREATE CLASS
        </BrutalButton>
      </div>

      {/* Class Cards Grid (Requirement 16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls, idx) => {
          const accents: Array<'lavender' | 'mint' | 'amber' | 'sky' | 'pink'> = [
            'lavender',
            'mint',
            'amber',
            'sky',
            'pink',
          ];
          const accent = accents[idx % accents.length];

          return (
            <BrutalCard key={cls.id} size="normal" accent={accent} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono">
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                    {cls.name.toUpperCase().replace(/\s/g, '_')}
                  </span>
                  <Badge variant="white">GRADE {cls.grade}</Badge>
                </div>

                <h3 className="text-xl font-extrabold text-[#0F172A] font-sans mb-1">
                  {cls.name} English Curriculum
                </h3>
                <p className="text-xs text-slate-600 mb-6 font-medium line-clamp-2">
                  {cls.description || 'Standard foundational reading and grammar'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] border-2 border-[#0F172A] mb-6 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">LESSONS</div>
                    <div className="text-sm font-extrabold text-[#0F172A]">
                      {cls.lessons_count ?? 0}
                    </div>
                  </div>
                  <div className="border-x-2 border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">STUDENTS</div>
                    <div className="text-sm font-extrabold text-[#0F172A]">
                      {cls.students_count ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">AVG SCORE</div>
                    <div className="text-sm font-extrabold text-emerald-700">
                      {cls.avg_score != null && cls.avg_score > 0 ? `${cls.avg_score}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BrutalButton
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  OPEN CLASS
                </BrutalButton>
              </div>
            </BrutalCard>
          );
        })}
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <BrutalCard size="large" accent="lavender" className="w-full max-w-md p-6 font-mono">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-4">
              <span className="font-extrabold text-sm text-[#0F172A]">CREATE_CLASS // NEW_REGISTRY</span>
              <button
                onClick={() => setShowModal(false)}
                className="font-bold text-xs px-2 py-0.5 border border-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Class Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 6"
                  required
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Grade Number</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(parseInt(e.target.value, 10))}
                  required
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase">Curriculum Description</label>
                <textarea
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="Brief curriculum description..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#0F172A] text-sm font-bold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="white" size="sm" onClick={() => setShowModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="lavender" size="sm" type="submit">
                  + CONFIRM CLASS
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
