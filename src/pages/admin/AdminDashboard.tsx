import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserProfile, SchoolClass } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Search,
  Trash2,
  Key,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  X,
  Lock,
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';

const DEFAULT_CURRICULUM_CLASSES: SchoolClass[] = [
  { id: 'CLS001', name: 'Class 1', grade: 1, description: 'Primary Grade 1 - Early English Foundations, Phonics & Basic Grammar' },
  { id: 'CLS002', name: 'Class 2', grade: 2, description: 'Primary Grade 2 - Sentence Construction, Vocabulary & Story Comprehension' },
  { id: 'CLS003', name: 'Class 3', grade: 3, description: 'Primary Grade 3 - Parts of Speech, Punctuation & Reading Passages' },
  { id: 'CLS004', name: 'Class 4', grade: 4, description: 'Grade 4 - Intermediate Grammar & Composition' },
  { id: 'CLS005', name: 'Class 5', grade: 5, description: 'Grade 5 - Advanced English & Literature' },
  { id: 'CLS006', name: 'Class 6', grade: 6, description: 'Grade 6 - Middle School English Foundations' },
  { id: 'CLS007', name: 'Class 7', grade: 7, description: 'Grade 7 - Middle School Grammar & Writing' },
  { id: 'CLS008', name: 'Class 8', grade: 8, description: 'Grade 8 - Middle School Literature & Analysis' },
  { id: 'CLS009', name: 'Class 9', grade: 9, description: 'Grade 9 - Secondary English & Composition' },
  { id: 'CLS010', name: 'Class 10', grade: 10, description: 'Grade 10 - Secondary Board English & Literature' },
  { id: 'CLS011', name: 'Class 11', grade: 11, description: 'Higher Secondary Grade 11 - Advanced English & Literature' },
  { id: 'CLS012', name: 'Class 12', grade: 12, description: 'Higher Secondary Grade 12 - Senior Board English & Language Studies' },
];

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<Array<UserProfile & { class_name?: string }>>([]);
  const [classes, setClasses] = useState<SchoolClass[]>(DEFAULT_CURRICULUM_CLASSES);
  const [stats, setStats] = useState({
    total_users: 0,
    total_teachers: 0,
    total_students: 0,
    total_classes: DEFAULT_CURRICULUM_CLASSES.length,
    admin_id: 'ADM1001',
    admin_email: 'admin@englishiq.app',
  });
  const [novaStats, setNovaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');

  // Modals state
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAdminCredsModal, setShowAdminCredsModal] = useState(false);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    email: '',
    password: '',
    idNumber: '',
  });

  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    idNumber: '',
    classId: 'CLS001',
  });

  const [adminCredsForm, setAdminCredsForm] = useState({
    idNumber: '',
    password: '',
    email: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, classesData, novaData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getClasses(),
        api.getNovaPortalAnalytics().catch(() => null),
      ]);
      const availableClasses = (classesData && classesData.length > 0) ? classesData : DEFAULT_CURRICULUM_CLASSES;
      setUsers(usersData);
      setStats({
        ...statsData,
        total_classes: statsData.total_classes || availableClasses.length,
      });
      setClasses(availableClasses);
      if (novaData) setNovaStats(novaData);
      setStudentForm((prev) => ({
        ...prev,
        classId: prev.classId || availableClasses[0].id,
      }));
      setAdminCredsForm({
        idNumber: statsData.admin_id,
        email: statsData.admin_email,
        password: '',
      });
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Teacher Handler
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanId = teacherForm.idNumber.trim().toUpperCase();
    if (!cleanId.startsWith('TCH')) {
      setFormError('Teacher ID must start with "TCH" (e.g. TCH1001, TCH1002)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAdminUser({
        full_name: teacherForm.fullName,
        email: teacherForm.email,
        password: teacherForm.password,
        role: 'teacher',
        id_number: cleanId,
      });

      setFormSuccess(`Teacher account created! ID: ${cleanId} // Password: ${teacherForm.password}`);
      setTeacherForm({ fullName: '', email: '', password: '', idNumber: '' });
      setShowAddTeacherModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create teacher account');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Student Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanId = studentForm.idNumber.trim().toUpperCase();
    if (!cleanId.startsWith('STU')) {
      setFormError('Student ID must start with "STU" (e.g. STU10001, STU10002)');
      return;
    }

    if (!studentForm.classId) {
      setFormError('Please select an enrolled class for the student');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAdminUser({
        full_name: studentForm.fullName,
        email: studentForm.email,
        password: studentForm.password,
        role: 'student',
        id_number: cleanId,
        class_id: studentForm.classId,
      });

      setFormSuccess(`Student account enrolled! ID: ${cleanId} // Password: ${studentForm.password}`);
      setStudentForm((prev) => ({ ...prev, fullName: '', email: '', password: '', idNumber: '' }));
      setShowAddStudentModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to enroll student account');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Admin Credentials
  const handleUpdateAdminCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.updateAdminCredentials({
        id_number: adminCredsForm.idNumber,
        email: adminCredsForm.email,
        password: adminCredsForm.password || undefined,
      });
      setFormSuccess('Admin credentials updated successfully!');
      setShowAdminCredsModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update credentials');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the school system?`)) {
      return;
    }
    try {
      await api.deleteAdminUser(userId);
      setFormSuccess(`User ${name} has been removed.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.id_number || '').toLowerCase().includes(query) ||
      (u.class_name || '').toLowerCase().includes(query) ||
      (u.achievement_badges || []).some((b) => b.name.toLowerCase().includes(query));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Top Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#C4B5FD] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
              ADMIN_PORTAL // SECURE_MANAGEMENT
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-[#0F172A] border border-[#0F172A]">
              PROVISIONING_AUTHORITY
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            School Administration &amp; User Provisioning
          </h1>
          <p className="text-xs text-slate-800 font-bold mt-0.5">
            Only administrators are authorized to create and manage teacher faculty and student accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BrutalButton
            variant="white"
            size="sm"
            onClick={() => setShowAdminCredsModal(true)}
            icon={<Key className="w-3.5 h-3.5" />}
          >
            ADMIN CREDENTIALS
          </BrutalButton>
        </div>
      </div>

      {/* Global Success / Notice Alert */}
      {formSuccess && (
        <div className="p-4 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-between text-xs font-bold text-[#0F172A]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-800" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="p-1 hover:bg-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BrutalCard accent="mint" className="p-4">
          <div className="text-[11px] font-bold text-slate-600 uppercase">TOTAL ROSTER</div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">{stats.total_users}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">ACCOUNTS ACTIVE</div>
        </BrutalCard>

        <BrutalCard accent="lavender" className="p-4">
          <div className="text-[11px] font-bold text-slate-600 uppercase">FACULTY TEACHERS</div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">{stats.total_teachers}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">AUTHORIZED STAFF</div>
        </BrutalCard>

        <BrutalCard accent="amber" className="p-4">
          <div className="text-[11px] font-bold text-slate-600 uppercase">ENROLLED STUDENTS</div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">{stats.total_students}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">ACTIVE LEARNERS</div>
        </BrutalCard>

        <BrutalCard accent="sky" className="p-4">
          <div className="text-[11px] font-bold text-slate-600 uppercase">SCHOOL CLASSES</div>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-1 font-sans">{stats.total_classes}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">CURRICULUM LEVELS</div>
        </BrutalCard>
      </div>

      {/* NOVA AI Learning Companion & Concept Mastery Overview */}
      <BrutalCard size="large" accent="lavender" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-900" />
                NOVA_AI_ARCHITECTURE // SCHOOL_WIDE_ANALYTICS
              </span>
              <span className="text-xs font-bold text-slate-600">
                CLOUD-FIRST HYBRID INFERENCE (GROQ)
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
              AI Study Engagement &amp; Cognitive Mastery Trends
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              School-wide metrics tracking student study time, concept mastery vs rote recall, teach-backs, and badges.
            </p>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-[#A7F3D0] border border-[#0F172A] text-emerald-950">
            RENDER_ORCHESTRATED
          </span>
        </div>

        {/* 4 AI Metric Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">AI Study Time</div>
            <div className="text-2xl font-black text-[#0F172A] font-sans mt-0.5">
              {novaStats?.total_study_hours ?? 18} Hours
            </div>
            <div className="text-[10px] text-indigo-900 font-bold mt-0.5">Across all students</div>
          </div>

          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Teach-Backs Evaluated</div>
            <div className="text-2xl font-black text-emerald-900 font-sans mt-0.5">
              {novaStats?.total_teachbacks_completed ?? 12}
            </div>
            <div className="text-[10px] text-emerald-800 font-bold mt-0.5">"Explain it to NOVA"</div>
          </div>

          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">School Recall Avg</div>
            <div className="text-2xl font-black text-sky-900 font-sans mt-0.5">
              {novaStats?.school_recall_average ?? 87}%
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">Factual retention</div>
          </div>

          <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Concept Understanding</div>
            <div className="text-2xl font-black text-indigo-950 font-sans mt-0.5">
              {novaStats?.school_understanding_average ?? 78}%
            </div>
            <div className="text-[10px] text-indigo-900 font-bold mt-0.5">Reasoning in own words</div>
          </div>
        </div>

        {/* Subject-Wise Understanding vs Recall Trends */}
        <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <span className="text-xs font-extrabold text-[#0F172A] uppercase block mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            SUBJECT-WISE COGNITIVE TRENDS (CONCEPT UNDERSTANDING VS MEMORY RECALL):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(novaStats?.learning_trends || [
              { subject: 'Science', understanding: 82, recall: 94 },
              { subject: 'Mathematics', understanding: 68, recall: 88 },
              { subject: 'English', understanding: 91, recall: 96 },
              { subject: 'Social Science', understanding: 75, recall: 89 },
            ]).map((t: any) => (
              <div key={t.subject} className="p-3 bg-[#F8FAFC] border border-[#0F172A] text-xs">
                <div className="font-extrabold text-[#0F172A] mb-1.5">{t.subject}</div>
                <div className="space-y-1 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Understanding:</span>
                    <span className="text-emerald-900 font-extrabold">{t.understanding}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 border border-[#0F172A]">
                    <div className="bg-emerald-500 h-full" style={{ width: `${t.understanding}%` }} />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Recall:</span>
                    <span className="text-sky-900 font-extrabold">{t.recall}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 border border-[#0F172A]">
                    <div className="bg-sky-500 h-full" style={{ width: `${t.recall}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BrutalCard>

      {/* Action Bar: Provision Buttons + Search + Role Filter */}
      <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#0F172A]">
          <div className="flex items-center gap-2">
            <BrutalButton
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError('');
                setShowAddTeacherModal(true);
              }}
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              + ADD NEW TEACHER
            </BrutalButton>

            <BrutalButton
              variant="mint"
              size="sm"
              onClick={() => {
                setFormError('');
                setShowAddStudentModal(true);
              }}
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            >
              + ADD NEW STUDENT
            </BrutalButton>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-500 text-[10px] uppercase">FILTER:</span>
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 border-2 border-[#0F172A] text-xs font-bold shadow-[1.5px_1.5px_0px_#0F172A] ${
                roleFilter === 'all' ? 'bg-[#0F172A] text-white' : 'bg-white text-[#0F172A]'
              }`}
            >
              ALL ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('teacher')}
              className={`px-2.5 py-1 border-2 border-[#0F172A] text-xs font-bold shadow-[1.5px_1.5px_0px_#0F172A] ${
                roleFilter === 'teacher' ? 'bg-[#C4B5FD] text-[#0F172A]' : 'bg-white text-[#0F172A]'
              }`}
            >
              TEACHERS ({stats.total_teachers})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-2.5 py-1 border-2 border-[#0F172A] text-xs font-bold shadow-[1.5px_1.5px_0px_#0F172A] ${
                roleFilter === 'student' ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-white text-[#0F172A]'
              }`}
            >
              STUDENTS ({stats.total_students})
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster by Name, Official ID (TCH/STU), Email, or Class..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border-2 border-[#0F172A] text-xs font-bold placeholder-slate-400 focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0F172A]"
          />
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#F8FAFC] border-b-2 border-[#0F172A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F172A]" />
            <span className="font-extrabold text-xs text-[#0F172A]">OFFICIAL SCHOOL DIRECTORY</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600">
            SHOWING {filteredUsers.length} OF {users.length} REGISTERED ACCOUNTS
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">
            [ LOADING SCHOOL DIRECTORY... ]
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="text-xs font-extrabold text-[#0F172A]">NO MATCHING USERS FOUND</div>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No users have been provisioned yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FEFCE8] border-b-2 border-[#0F172A] text-[11px] font-extrabold text-[#0F172A]">
                  <th className="p-3">FULL NAME</th>
                  <th className="p-3">OFFICIAL ID</th>
                  <th className="p-3">ROLE</th>
                  <th className="p-3">EMAIL ADDRESS</th>
                  <th className="p-3">ASSIGNED CLASS</th>
                  <th className="p-3">ACHIEVEMENT BADGES</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0F172A]">
                {filteredUsers.map((u) => {
                  const isPrimaryAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-[#0F172A]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border border-[#0F172A] bg-[#C4B5FD] flex items-center justify-center font-extrabold text-[10px]">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <span>{u.full_name}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FEFCE8] border border-[#0F172A] font-extrabold text-[11px]">
                          <span>{u.id_number || (u as any).user_id || '—'}</span>
                          {u.id_number && (
                            <button
                              onClick={() => handleCopy(u.id_number || '')}
                              className="text-slate-500 hover:text-[#0F172A]"
                              title="Copy ID"
                            >
                              {copiedId === u.id_number ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-extrabold border border-[#0F172A] uppercase ${
                            u.role === 'admin'
                              ? 'bg-[#0F172A] text-white'
                              : u.role === 'teacher'
                              ? 'bg-[#C4B5FD] text-[#0F172A]'
                              : 'bg-[#A7F3D0] text-[#0F172A]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-slate-700">{u.email}</td>

                      <td className="p-3">
                        {u.role === 'student' ? (
                          <span className="px-2 py-0.5 bg-white border border-[#0F172A] text-[10px] font-extrabold text-indigo-900">
                            {u.class_name || u.class_id || 'Class 1'}
                          </span>
                        ) : u.role === 'teacher' ? (
                          <span className="text-[11px] text-slate-500 font-bold">All Assigned Classes</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-bold">Full System Access</span>
                        )}
                      </td>

                      <td className="p-3">
                        {u.role === 'student' ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Attendance Achievement Badge */}
                            <span
                              className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[10px] font-extrabold text-[#0F172A] shadow-[1px_1px_0px_#0F172A] inline-flex items-center gap-1"
                              title="Portal Attendance Badge — Awarded when student logs in and attends the portal"
                            >
                              🎖️ Attendance
                            </span>

                            {/* Test Responsibility Achievement Badge */}
                            {u.achievement_badges?.some((b) => b.id === 'ach-responsibility' && b.unlocked) ? (
                              <span
                                className="px-2 py-0.5 bg-[#C4B5FD] border border-[#0F172A] text-[10px] font-extrabold text-[#0F172A] shadow-[1px_1px_0px_#0F172A] inline-flex items-center gap-1"
                                title="Test Responsibility Badge — Fulfill duty by attending & submitting test evaluations"
                              >
                                🛡️ Responsibility
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.5 bg-slate-100 border border-dashed border-slate-400 text-[9px] font-bold text-slate-500 inline-flex items-center gap-1"
                                title="Student has not attended a test evaluation yet"
                              >
                                ⏳ Needs Test
                              </span>
                            )}

                            {/* High Achiever Badge */}
                            {u.achievement_badges?.some((b) => b.type === 'excellence' && b.unlocked) && (
                              <span
                                className="px-2 py-0.5 bg-[#FEFCE8] border border-[#0F172A] text-[10px] font-extrabold text-[#0F172A] shadow-[1px_1px_0px_#0F172A] inline-flex items-center gap-1"
                                title="High Achiever Badge — Scored 90%+ in test evaluation"
                              >
                                ⭐ High Achiever
                              </span>
                            )}
                          </div>
                        ) : u.role === 'teacher' ? (
                          <span className="text-[11px] text-slate-500 font-bold">Faculty Member</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-bold">System Administrator</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="p-1.5 border border-[#0F172A] bg-white text-rose-700 hover:bg-rose-100 shadow-[1px_1px_0px_#0F172A] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD TEACHER */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <BrutalCard accent="lavender" size="large" className="w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-800" />
                <span className="font-extrabold text-sm text-[#0F172A]">PROVISION NEW TEACHER</span>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="p-1 border border-[#0F172A] bg-white hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 mb-3 bg-rose-100 border border-[#0F172A] text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                  placeholder="e.g. Priya Kumar"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Teacher ID Number</label>
                <input
                  type="text"
                  required
                  value={teacherForm.idNumber}
                  onChange={(e) => setTeacherForm({ ...teacherForm, idNumber: e.target.value })}
                  placeholder="e.g. TCH1001 or TCH1002"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  Must begin with &quot;TCH&quot; to authorize teacher privileges.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="Enter teacher email address"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div className="pt-3 border-t-2 border-[#0F172A] flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  size="sm"
                  onClick={() => setShowAddTeacherModal(false)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'PROVISIONING...' : '[ CREATE TEACHER ]'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* MODAL 2: ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <BrutalCard accent="mint" size="large" className="w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-800" />
                <span className="font-extrabold text-sm text-[#0F172A]">ENROLL NEW STUDENT</span>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 border border-[#0F172A] bg-white hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 mb-3 bg-rose-100 border border-[#0F172A] text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="e.g. Aarav Kumar"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Student ID Number</label>
                <input
                  type="text"
                  required
                  value={studentForm.idNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, idNumber: e.target.value })}
                  placeholder="e.g. STU10001 or STU10002"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  Must begin with &quot;STU&quot; for student enrollment.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Assigned Class</label>
                <select
                  required
                  value={studentForm.classId || (classes[0]?.id || 'CLS001')}
                  onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                >
                  {(classes.length > 0 ? classes : DEFAULT_CURRICULUM_CLASSES).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Grade {c.grade})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  Student will be locked to this curriculum level.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="Enter student email address"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div className="pt-3 border-t-2 border-[#0F172A] flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  size="sm"
                  onClick={() => setShowAddStudentModal(false)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'ENROLLING...' : '[ ENROLL STUDENT ]'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* MODAL 3: UPDATE ADMIN CREDENTIALS */}
      {showAdminCredsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <BrutalCard accent="amber" size="large" className="w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-900" />
                <span className="font-extrabold text-sm text-[#0F172A]">ADMIN CREDENTIALS</span>
              </div>
              <button
                onClick={() => setShowAdminCredsModal(false)}
                className="p-1 border border-[#0F172A] bg-white hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 mb-3 bg-rose-100 border border-[#0F172A] text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminCreds} className="space-y-3 text-xs">
              <div className="p-3 bg-[#FEFCE8] border border-[#0F172A] text-[11px] font-bold text-slate-700">
                You can specify the official Administrator ID and Password used to sign in and provision accounts.
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Admin ID Number</label>
                <input
                  type="text"
                  required
                  value={adminCredsForm.idNumber}
                  onChange={(e) => setAdminCredsForm({ ...adminCredsForm, idNumber: e.target.value })}
                  placeholder="e.g. ADM1001"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminCredsForm.email}
                  onChange={(e) => setAdminCredsForm({ ...adminCredsForm, email: e.target.value })}
                  placeholder="e.g. admin@englishiq.app"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1 uppercase">New Admin Password</label>
                <input
                  type="password"
                  value={adminCredsForm.password}
                  onChange={(e) => setAdminCredsForm({ ...adminCredsForm, password: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  className="w-full px-3 py-2 bg-white border-2 border-[#0F172A] font-bold text-sm focus:outline-none focus:bg-[#FEFCE8]"
                />
              </div>

              <div className="pt-3 border-t-2 border-[#0F172A] flex justify-end gap-2">
                <BrutalButton
                  type="button"
                  variant="white"
                  size="sm"
                  onClick={() => setShowAdminCredsModal(false)}
                >
                  CANCEL
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'SAVING...' : '[ SAVE CREDENTIALS ]'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
