import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ParentTeacherMessage, UserProfile } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { MessageSquare, Send, User, CheckCircle, RefreshCw } from 'lucide-react';

export const ParentMessages: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [messages, setMessages] = useState<ParentTeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';

  const loadInitial = async () => {
    try {
      setLoading(true);
      const userList = await api.getAdminUsers();
      const teacherList = userList.filter((u) => u.role === 'teacher');
      setTeachers(teacherList);

      if (teacherList.length > 0) {
        setSelectedTeacherId(teacherList[0].id);
        const thread = await api.getMessages({ student_id: studentId });
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
  }, [studentId]);

  const handleTeacherSelect = async (tId: string) => {
    setSelectedTeacherId(tId);
    try {
      const thread = await api.getMessages({ student_id: studentId, other_user_id: tId });
      setMessages(thread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeacherId) return;
    try {
      setSending(true);
      await api.sendMessage({
        recipient_id: selectedTeacherId,
        student_id: studentId,
        message: newMessage.trim(),
      });
      setNewMessage('');
      const updated = await api.getMessages({ student_id: studentId });
      setMessages(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <MessageSquare className="w-7 h-7" /> Teacher Communication Channel
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Official messaging with {activeChild?.student_name}'s Class Teacher and Subject Faculty
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={() => handleTeacherSelect(selectedTeacherId)}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faculty List */}
        <div className="space-y-3">
          <BrutalCard size="medium" accent="yellow" className="p-4">
            <h3 className="font-black text-xs text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-3">
              Assigned Faculty
            </h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {teachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTeacherSelect(t.id)}
                  className={`w-full text-left p-2.5 border-2 border-[#0F172A] text-xs font-bold transition-all flex items-center justify-between ${
                    selectedTeacherId === t.id
                      ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                      : 'bg-white text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-extrabold truncate">{t.full_name}</div>
                    <div className="text-[10px] opacity-75">{t.id_number || t.email}</div>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 border border-current font-extrabold uppercase">
                    TEACHER
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
                  Chatting with Faculty Member:
                </span>
                <span className="text-sm font-black text-[#0F172A]">
                  {selectedTeacher?.full_name || 'Select a Teacher'}
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
                STUDENT: {activeChild?.student_name || 'Aarav Kumar'}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id || m.sender_role === 'parent';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[9px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                      <span>{isMe ? 'You (Parent)' : `${m.sender_name || 'Teacher'}`}</span>
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
                  No previous messages. Start a conversation with {selectedTeacher?.full_name} below.
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t-2 border-[#0F172A] flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask teacher a question or submit leave request..."
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
export default ParentMessages;
