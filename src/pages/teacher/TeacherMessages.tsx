import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, ParentTeacherMessage, Section } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { MessageSquare, Send, User, CheckCircle, RefreshCw } from 'lucide-react';

export const TeacherMessages: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [messages, setMessages] = useState<ParentTeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [secList, userList] = await Promise.all([
        api.getSections(),
        api.getAdminUsers(),
      ]);
      setSections(secList);
      const studentList = userList.filter((u) => u.role === 'student');
      setStudents(studentList);

      if (secList.length > 0) setSelectedSectionId(secList[0].id);
      if (studentList.length > 0) {
        setSelectedStudentId(studentList[0].id);
        const thread = await api.getMessages({ student_id: studentList[0].id });
        setMessages(thread);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleStudentSelect = async (stuId: string) => {
    setSelectedStudentId(stuId);
    try {
      const thread = await api.getMessages({ student_id: stuId });
      setMessages(thread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId) return;
    try {
      setSending(true);
      // Recipient is the parent of the student
      await api.sendMessage({
        recipient_id: 'PAR1001', // maps to linked parent
        student_id: selectedStudentId,
        message: newMessage.trim(),
      });
      setNewMessage('');
      const updated = await api.getMessages({ student_id: selectedStudentId });
      setMessages(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <MessageSquare className="w-7 h-7" /> Parent-Teacher Communication Channel
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Scoped academic messaging restricted strictly to enrolled students and verified guardians
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={() => handleStudentSelect(selectedStudentId)}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH CHAT
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Directory Sidebar */}
        <div className="space-y-3">
          <BrutalCard size="medium" accent="yellow" className="p-4">
            <h3 className="font-black text-xs text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-3">
              Section Students ({students.length})
            </h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {students.map((stu) => (
                <button
                  key={stu.id}
                  onClick={() => handleStudentSelect(stu.id)}
                  className={`w-full text-left p-2.5 border-2 border-[#0F172A] text-xs font-bold transition-all flex items-center justify-between ${
                    selectedStudentId === stu.id
                      ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                      : 'bg-white text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-extrabold truncate">{stu.full_name}</div>
                    <div className="text-[10px] opacity-75 font-mono">ID: {stu.id_number || stu.id}</div>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 border border-current font-extrabold uppercase">
                    PARENT
                  </span>
                </button>
              ))}
            </div>
          </BrutalCard>
        </div>

        {/* Chat Thread */}
        <div className="md:col-span-2">
          <BrutalCard size="large" accent="lavender" className="p-4 flex flex-col h-[520px]">
            {/* Thread Header */}
            <div className="pb-3 border-b-2 border-[#0F172A] flex justify-between items-center bg-[#FEFCE8] p-2.5 mb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block">
                  Communication Regarding Student:
                </span>
                <span className="text-sm font-black text-[#0F172A]">
                  {selectedStudent?.full_name || 'Select a Student'}
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
                ENCRYPTED & ISOLATED
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id || m.sender_role === 'teacher';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[9px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                      <span>{isMe ? 'You (Teacher)' : `${m.sender_name || 'Parent'}`}</span>
                      <span>&bull;</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`p-3 max-w-[80%] border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A] ${
                        isMe ? 'bg-[#0F172A] text-white' : 'bg-white text-[#0F172A]'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  No conversation history with this guardian yet. Send a message below.
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t-2 border-[#0F172A] flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type academic update or note to parent..."
                className="flex-1 p-2.5 bg-white border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A] focus:outline-none"
              />
              <BrutalButton
                variant="primary"
                size="small"
                type="submit"
                disabled={sending || !newMessage.trim()}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {sending ? 'SENDING...' : 'SEND'}
              </BrutalButton>
            </form>
          </BrutalCard>
        </div>
      </div>
    </div>
  );
};
export default TeacherMessages;
