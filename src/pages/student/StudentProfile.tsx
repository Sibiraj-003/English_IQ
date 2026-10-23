import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import {
  speakWithNovaVoice,
  getPreferredFemaleVoice,
  stopNovaSpeech,
  isNovaSpeaking,
} from '../../utils/novaVoice';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Check,
  Copy,
  Edit3,
  Save,
  X,
  School,
  GraduationCap,
  ShieldCheck,
  Heart,
  Award,
  ArrowLeft,
  RotateCcw,
  QrCode,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Scholar', emoji: '🧑‍🎓', color: '#C4B5FD' },
  { id: 'av-2', label: 'Astronaut', emoji: '🧑‍🚀', color: '#BAE6FD' },
  { id: 'av-3', label: 'Scientist', emoji: '🧑‍🔬', color: '#A7F3D0' },
  { id: 'av-4', label: 'Tech Whiz', emoji: '💻', color: '#FDE68A' },
  { id: 'av-5', label: 'Artist', emoji: '🎨', color: '#FBCFE8' },
  { id: 'av-6', label: 'Explorer', emoji: '🧭', color: '#FED7AA' },
];

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  // Editing toggle
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98888 11111');
  const [dob, setDob] = useState(user?.dob || '2018-05-14');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [parentName, setParentName] = useState(user?.parent_name || 'Rajesh Kumar');
  const [parentPhone, setParentPhone] = useState(user?.parent_phone || '+91 98888 22222');
  const [bio, setBio] = useState(
    user?.bio || 'Enthusiastic scholar who loves science experiments, reading stories, and exploring space with NOVA!'
  );
  const [address, setAddress] = useState(user?.address || '42 Lakeview Enclave, Knowledge City');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '🧑‍🎓');

  // Academic stats from progress
  const [stats, setStats] = useState({
    learningProgress: 78,
    lessonsCompleted: '12 / 16',
    avgScore: 84,
    studyHours: '14.5 hrs',
    badgesCount: 5,
  });

  // Voice testing state
  const [voiceTesting, setVoiceTesting] = useState(false);
  const [detectedVoiceName, setDetectedVoiceName] = useState<string>('Detecting Natural Female Voice...');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      if (user.phone) setPhone(user.phone);
      if (user.dob) setDob(user.dob);
      if (user.gender) setGender(user.gender);
      if (user.parent_name) setParentName(user.parent_name);
      if (user.parent_phone) setParentPhone(user.parent_phone);
      if (user.bio) setBio(user.bio);
      if (user.address) setAddress(user.address);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);

      // Load progress stats
      api
        .getStudentProgress(user.id)
        .then((prog) => {
          if (prog) {
            setStats({
              learningProgress: prog.learning_progress_percent || 78,
              lessonsCompleted: prog.lessons_completed || '12 / 16',
              avgScore: prog.average_score || 84,
              studyHours: `${((prog.study_time_minutes || 420) / 60).toFixed(1)} hrs`,
              badgesCount: prog.achievements?.filter((a) => a.unlocked).length || 5,
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Voice name resolution
  useEffect(() => {
    const resolveVoice = () => {
      const v = getPreferredFemaleVoice();
      if (v) {
        setDetectedVoiceName(`${v.name} (${v.lang})`);
      } else {
        setDetectedVoiceName('Natural Web Speech Female Voice');
      }
    };
    resolveVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = resolveVoice;
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleCopyId = () => {
    const idToCopy = user?.id_number || 'STU10001';
    navigator.clipboard.writeText(idToCopy).then(() => {
      setCopiedId(true);
      showToast(`Student ID "${idToCopy}" copied!`);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        dob,
        gender,
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim(),
        bio: bio.trim(),
        address: address.trim(),
        avatar_url: avatarUrl,
      };

      if (updateProfile) {
        await updateProfile(updateData);
      } else {
        await api.updateProfile(updateData);
      }

      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showToast(err.message || 'Failed to update profile. Local changes saved.');
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestFemaleVoice = () => {
    if (isNovaSpeaking() || voiceTesting) {
      stopNovaSpeech();
      setVoiceTesting(false);
      return;
    }

    const firstName = fullName.trim().split(' ')[0] || 'Scholar';
    const sampleText = `Hello ${firstName}! I am NOVA, your AI learning friend. I am speaking using this natural female voice, which is also used for my 3D floating companion throughout your school portal!`;

    setVoiceTesting(true);
    speakWithNovaVoice(sampleText, {
      onEnd: () => setVoiceTesting(false),
      onError: () => setVoiceTesting(false),
    });
  };

  const handleReset3DPosition = () => {
    try {
      window.dispatchEvent(
        new CustomEvent('nova_companion_panel_state', {
          detail: { isHidden: false, resetPosition: true },
        })
      );
      showToast('NOVA 3D Companion position reset to screen center!');
    } catch {
      showToast('Reset command sent.');
    }
  };

  return (
    <div className="space-y-6 font-mono max-w-5xl mx-auto pb-10">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-[#0F172A] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="p-1.5 bg-white hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            title="Back to Student Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] uppercase">
                STUDENT_ID_CARD
              </span>
              <span className="text-xs font-bold text-slate-500">v1.0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] font-sans">
              Student Profile & Academic Record
            </h1>
          </div>
        </div>

        {/* Edit / Save Action Button */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-xs font-black text-slate-700 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>CANCEL</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-xs font-black text-[#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-[#FDE68A] hover:bg-[#FCD34D] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-xs font-black text-[#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>EDIT PROFILE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Student ID Card Header (Neobrutalist Badge) */}
      <div className="bg-white border-3 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] p-5 sm:p-6 relative overflow-hidden">
        {/* Background decorative watermark */}
        <div className="absolute right-4 top-4 opacity-5 pointer-events-none select-none hidden md:block">
          <GraduationCap className="w-48 h-48 text-[#0F172A]" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          {/* Avatar / Portrait with preset selector in edit mode */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#C4B5FD] border-3 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-center text-5xl sm:text-6xl select-none relative group">
              <span>{avatarUrl || '🧑‍🎓'}</span>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold text-center p-1">
                  Click preset below
                </div>
              )}
            </div>

            {/* Presets in edit mode */}
            {isEditing && (
              <div className="flex items-center gap-1 pt-1">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarUrl(av.emoji)}
                    className={`p-1 border border-[#0F172A] text-sm hover:scale-110 transition-transform ${
                      avatarUrl === av.emoji ? 'bg-[#FDE68A] ring-2 ring-[#0F172A]' : 'bg-white'
                    }`}
                    title={av.label}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Identity Information */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[#0F172A] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-800" />
                OFFICIAL SCHOLAR ID
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#BAE6FD] border border-[#0F172A] text-[#0F172A]">
                CLASS {user?.class_name || 'Class 1'} • SECTION {user?.section_name || '1-A'}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 border border-[#0F172A] text-slate-700">
                ACTIVE DAY SCHOLAR
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 block">
                  Full Name:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-lg sm:text-xl font-black px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden font-sans"
                  placeholder="Student Full Name"
                />
              </div>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-sans tracking-tight">
                {user?.full_name || 'Aarav Kumar (Student)'}
              </h2>
            )}

            {/* Quick badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* ID Number with copy button */}
              <div
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-[#FDE68A] cursor-pointer transition-colors"
                title="Click to copy Student ID Number"
              >
                <QrCode className="w-3.5 h-3.5 text-[#0F172A]" />
                <span className="text-xs font-black text-[#0F172A]">
                  ID: {user?.id_number || 'STU10001'}
                </span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-700" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500" />
                )}
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#0F172A] text-xs font-bold text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email || 'student@englishiq.app'}</span>
              </div>
            </div>

            {/* Bio */}
            {isEditing ? (
              <div className="pt-1">
                <label className="text-[10px] font-black uppercase text-slate-600 block mb-0.5">
                  About Me / Learning Motto:
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-bold p-1.5 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden font-sans"
                  placeholder="Share a short bio or learning goals..."
                />
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-700 italic pt-1 font-sans">
                "{bio}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4 Academic Quick-Stat Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <BrutalCard size="normal" accent="mint" className="p-3.5 bg-white">
          <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase">
            <span>CURRICULUM_MASTERY</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-sans mt-1">
            {stats.learningProgress}%
          </div>
          <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Across All Subjects</p>
        </BrutalCard>

        <BrutalCard size="normal" accent="lavender" className="p-3.5 bg-white">
          <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase">
            <span>LESSONS_COMPLETED</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-sans mt-1">
            {stats.lessonsCompleted}
          </div>
          <p className="text-[10px] font-bold text-indigo-700 mt-0.5">Units Mastered</p>
        </BrutalCard>

        <BrutalCard size="normal" accent="amber" className="p-3.5 bg-white">
          <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase">
            <span>AVERAGE_SCORE</span>
            <Award className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-sans mt-1">
            {stats.avgScore}%
          </div>
          <p className="text-[10px] font-bold text-amber-700 mt-0.5">Test Performance</p>
        </BrutalCard>

        <BrutalCard size="normal" accent="sky" className="p-3.5 bg-white">
          <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase">
            <span>HONORS_&_BADGES</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-sans mt-1">
            {stats.badgesCount}
          </div>
          <p className="text-[10px] font-bold text-sky-700 mt-0.5">Verified Honors</p>
        </BrutalCard>
      </div>

      {/* Grid: 2 Columns for Profile Info and AI Voice Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Personal, Academic, and Guardian Details */}
        <div className="space-y-6">
          {/* Card 1: Personal & Contact Details */}
          <BrutalCard className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0F172A]" />
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                  Personal & Contact Information
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
                {isEditing ? 'EDITING' : 'SECURE'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> Student Phone:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden"
                  />
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200">
                    {phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Date of Birth:
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden font-mono"
                  />
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200">
                    {dob || '2018-05-14'}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600">Gender:</label>
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200">
                    {gender || 'Male'}
                  </p>
                )}
              </div>

              {/* Email (Institutional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" /> School Email:
                </label>
                <p className="font-bold text-slate-700 bg-slate-100 p-1.5 border border-slate-300 truncate" title={user?.email}>
                  {user?.email || 'student@englishiq.app'}
                </p>
              </div>

              {/* Address */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> Residential Address:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden font-sans"
                  />
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200 font-sans">
                    {address}
                  </p>
                )}
              </div>
            </div>
          </BrutalCard>

          {/* Card 2: Parent & Guardian Details */}
          <BrutalCard className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                  Parent & Guardian Information
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FBCFE8] text-[#0F172A] border border-[#0F172A]">
                EMERGENCY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600">
                  Primary Guardian Name:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden"
                  />
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200">
                    {parentName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600">
                  Guardian Phone / WhatsApp:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full font-bold px-2 py-1 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden"
                  />
                ) : (
                  <p className="font-bold text-[#0F172A] bg-slate-50 p-1.5 border border-slate-200">
                    {parentPhone}
                  </p>
                )}
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* Right Column: Academic Registry + Live Female Voice Engine */}
        <div className="space-y-6">
          {/* Card 3: Live Female Voice & 3D Assistant Integration */}
          <BrutalCard size="normal" accent="amber" className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                  Live Voice & 3D Floating AI Companion
                </h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] animate-pulse">
                SYNCHRONIZED
              </span>
            </div>

            <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  VOICE PROFILE: REAL-TIME NATURAL FEMALE
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-white border border-[#0F172A] text-[#0F172A]">
                  FEMALE TTS
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 font-sans">
                Active Engine Voice: <span className="font-black text-[#0F172A]">{detectedVoiceName}</span>
              </p>
              <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                The exact same crystal-clear live female voice is used for conversational Socratic tutoring in the NOVA AI Teacher and for greetings when tapping your 3D floating companion!
              </p>
            </div>

            {/* Live Voice Playback Tester */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleTestFemaleVoice}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] font-black text-xs transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                  voiceTesting
                    ? 'bg-rose-200 text-rose-900 border-rose-900'
                    : 'bg-[#C4B5FD] hover:bg-[#A78BFA] text-[#0F172A]'
                }`}
              >
                {voiceTesting ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-800" />
                    <span>STOP LIVE VOICE TEST</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#0F172A] animate-bounce" />
                    <span>TEST LIVE FEMALE VOICE (3D ROBOT & AI)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset3DPosition}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-black text-xs text-[#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
                <span>RESET 3D COMPANION ON SCREEN</span>
              </button>
            </div>
          </BrutalCard>

          {/* Card 4: Academic Registry & Institutional Enrollment */}
          <BrutalCard className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#0F172A]" />
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                  Academic & Cohort Enrollment
                </h3>
              </div>
              <Badge variant="amber">OFFICIAL</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-500">School Campus:</span>
                <p className="font-extrabold text-[#0F172A]">Oakridge Smart School</p>
                <span className="text-[9px] text-slate-400 font-mono">CODE: SCH001</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-500">Academic Year:</span>
                <p className="font-extrabold text-[#0F172A]">2025 - 2026 Session</p>
                <span className="text-[9px] text-slate-400 font-mono">AFFILIATED CBSE</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-500">Enrolled Class:</span>
                <p className="font-extrabold text-[#0F172A]">{user?.class_name || 'Class 1'}</p>
                <span className="text-[9px] text-slate-400 font-mono">PRIMARY DIVISION</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-500">Assigned Section:</span>
                <p className="font-extrabold text-[#0F172A]">{user?.section_name || 'Section 1-A'}</p>
                <span className="text-[9px] text-slate-400 font-mono">ROOM: 101</span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Section Mentor:</span>
                  <p className="font-extrabold text-[#0F172A] text-xs">Priya Sharma (Primary Faculty)</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/ai-teacher')}
                  className="px-2.5 py-1 bg-[#FDE68A] hover:bg-[#FCD34D] border border-[#0F172A] text-[10px] font-black text-[#0F172A] shadow-[1px_1px_0px_#0F172A] flex items-center gap-1 cursor-pointer"
                >
                  <Bot className="w-3 h-3" />
                  <span>OPEN NOVA</span>
                </button>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0F172A] text-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#FDE68A] px-4 py-2 font-mono text-xs font-extrabold animate-bounce">
          <Check className="w-4 h-4 text-[#A7F3D0]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
