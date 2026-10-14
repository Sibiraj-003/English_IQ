import React, { useState, useRef, useEffect } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { SourceBadge } from '../../components/SourceBadge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Bot, Send, Sparkles } from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  sourceBadge?: {
    bookTitle: string;
    pageNumber: number;
    lessonTitle?: string;
  };
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const AiTeacher: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'ask' | 'explain' | 'practice' | 'quiz' | 'revision'>('ask');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${user?.full_name || 'Student'}! 🌟 I am your EnglishIQ AI Teacher.\n\nAsk me any question about your English lessons, vocabulary, or grammar. You can also request fun examples or practice a quick quiz!`,
      suggestedFollowUps: [
        'What is a noun?',
        'Give me an example of a verb with animals',
        'Quick quiz on naming words',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const studentMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.askAiTeacher({
        student_id: user?.id,
        class_id: user?.class_id,
        message: text,
        mode,
      });

      const aiMsg: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: response.answer,
        sourceBadge: response.sourceBadge,
        suggestedFollowUps: response.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: `I couldn't find that in your current textbook. You can ask your teacher or try another question.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    if (newMode === 'explain') {
      sendMessage('Explain what a noun is with examples');
    } else if (newMode === 'practice') {
      sendMessage('Give me 2 practice questions about naming words');
    } else if (newMode === 'quiz') {
      sendMessage('Give me a quick 1-question check quiz on pronouns');
    } else if (newMode === 'revision') {
      sendMessage('Give me a revision summary for our current English lesson');
    }
  };

  return (
    <div className="space-y-3 font-mono w-full flex-1 flex flex-col min-h-0 h-[calc(100vh-120px)]">
      {/* Terminal Header */}
      <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-[#A7F3D0]">
              AI TEACHER // READY TO HELP
            </span>
            <span className="text-xs font-bold text-slate-500">
              CURRICULUM_GROUNDED
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#0F172A] font-sans mt-0.5">
            Your Personal English Learning Assistant
          </h2>
        </div>

        {/* AI Teaching Mode Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ask', label: 'ASK AI' },
            { id: 'explain', label: 'EXPLAIN' },
            { id: 'practice', label: 'PRACTICE' },
            { id: 'quiz', label: 'QUICK QUIZ' },
            { id: 'revision', label: 'REVISION' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id as any)}
              className={`px-2.5 py-1 text-xs font-extrabold border-2 border-[#0F172A] transition-all ${
                mode === m.id
                  ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#A7F3D0]'
                  : 'bg-white text-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-slate-50'
              }`}
            >
              [ {m.label} ]
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-slate-500">
              <span>{msg.sender === 'student' ? `${user?.full_name?.toUpperCase() || 'STUDENT'} (YOU)` : 'AI TEACHER'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`max-w-3xl lg:max-w-4xl p-4 border-2 border-[#0F172A] ${
                msg.sender === 'student'
                  ? 'bg-[#FEFCE8] text-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
                  : 'bg-white text-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
              }`}
            >
              {/* Message text */}
              <div className="font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {msg.text}
              </div>

              {/* Source Transparency Badge */}
              {msg.sourceBadge && (
                <div className="mt-3 pt-2.5 border-t border-slate-200">
                  <SourceBadge
                    bookTitle={msg.sourceBadge.bookTitle}
                    pageNumber={msg.sourceBadge.pageNumber}
                    lessonTitle={msg.sourceBadge.lessonTitle}
                  />
                </div>
              )}

              {/* Suggested Follow-ups */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-3 pt-2 flex flex-wrap gap-1.5 font-mono">
                  {msg.suggestedFollowUps.map((su, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => sendMessage(su)}
                      className="px-2 py-0.5 text-xs font-bold bg-[#F8FAFC] hover:bg-[#A7F3D0] border border-[#0F172A] transition-all text-slate-800"
                    >
                      💡 {su}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start font-mono">
            <div className="text-[11px] font-bold text-slate-500 mb-1">
              AI TEACHER // THINKING
            </div>
            <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center gap-2 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              RETRIEVING LESSON CONTENT & FORMULATING EXPLANATION...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me: What is a noun? Give me examples..."
            className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] text-sm font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0F172A]"
          />
          <BrutalButton
            type="submit"
            variant="mint"
            disabled={!input.trim() || loading}
            icon={<Send className="w-4 h-4" />}
          >
            [ SEND ]
          </BrutalButton>
        </form>
      </div>
    </div>
  );
};
