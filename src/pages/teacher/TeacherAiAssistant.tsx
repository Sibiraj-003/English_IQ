import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  TeacherCopilotMessage,
  TeacherCopilotSummaryData,
  TeacherCopilotResponse,
  TeacherCopilotDataCard,
  TeacherCopilotAlert,
} from '../../types';
import {
  speakWithNovaVoice,
  stopNovaSpeech,
  isNovaSpeaking,
} from '../../utils/novaVoice';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Award,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  Trash2,
  FileText,
  School,
} from 'lucide-react';

/**
 * Renders inline text safely without raw asterisks, properly converting **bold** into <strong>
 * and handling code snippets, status badges, etc.
 */
function renderCleanInline(text: string): React.ReactNode {
  if (!text) return null;

  // Clean any leading asterisks or dashes
  const cleaned = text.replace(/^[\*\-\s]+/, '');

  // Split text by markdown tokens: **bold**, `code`, etc.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      // Normal text chunk: strip any stray single asterisks
      const chunk = cleaned.slice(lastIndex, match.index).replace(/\*/g, '');
      if (chunk) parts.push(chunk);
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2).replace(/\*/g, '');
      parts.push(
        <strong key={match.index} className="font-black text-[#0F172A]">
          {boldContent}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#0F172A]"
        >
          {codeContent}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex).replace(/\*/g, '');
    if (remaining) parts.push(remaining);
  }

  return <>{parts}</>;
}

/**
 * Formats table cell content with semantic badges for scores, status, and attendance.
 */
function renderTableCellContent(cell: string): React.ReactNode {
  if (!cell) return null;
  const trimmed = cell.trim().replace(/\*\*/g, '');
  const lower = trimmed.toLowerCase();

  // Status badges: At-Risk / Critical
  if (lower.includes('at-risk') || lower.includes('critical') || lower.includes('danger') || lower.includes('fail')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-mono font-black text-[10px] uppercase shadow-[1px_1px_0px_#F43F5E]">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        {trimmed}
      </span>
    );
  }

  // Attendance: Absent
  if (lower.includes('absent')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-mono font-black text-[10px] uppercase shadow-[1px_1px_0px_#F59E0B]">
        {trimmed}
      </span>
    );
  }

  // Attendance: Present / Good / Mastery
  if (lower.includes('present') || lower.includes('mastery') || lower.includes('pass')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-[10px] uppercase shadow-[1px_1px_0px_#10B981]">
        {trimmed}
      </span>
    );
  }

  // Scores (e.g. 20%, 45%, 85%)
  const scoreMatch = trimmed.match(/^(\d{1,3})%$/);
  if (scoreMatch) {
    const scoreVal = parseInt(scoreMatch[1], 10);
    return (
      <span
        className={`font-mono font-black text-xs ${
          scoreVal < 60 ? 'text-rose-600' : scoreVal >= 80 ? 'text-emerald-700' : 'text-[#0F172A]'
        }`}
      >
        {trimmed}
      </span>
    );
  }

  return renderCleanInline(cell);
}

/**
 * Formats a recommendation or action item, identifying prefix labels (e.g., "DIAGNOSTIC INTERVENTION:")
 * and rendering them as distinct tag badges with well-spaced body text.
 */
function renderItemContent(content: string): React.ReactNode {
  if (!content) return null;
  const trimmed = content.trim();

  // Match optional bold tag and label before colon: e.g. **Class Average:** 48% or Diagnostic Intervention:
  const labelMatch = trimmed.match(/^((\*\*)?([A-Za-z0-9\s\-–—/]{2,35}?)(\*\*)?:)\s*(.*)$/s);
  if (labelMatch) {
    const rawLabel = labelMatch[3].trim().replace(/\*\*/g, '');
    const rest = labelMatch[5].trim();

    return (
      <span className="inline">
        <span className="inline-block px-1.5 py-0.5 mr-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-mono font-black text-[10px] uppercase tracking-wide">
          {rawLabel}:
        </span>
        <span className="text-slate-800">{renderCleanInline(rest)}</span>
      </span>
    );
  }

  return renderCleanInline(trimmed);
}

/**
 * Parses and formats Copilot answers into clean, numbered sections and neat HTML tables,
 * completely eliminating raw asterisks and unordered bullet marks.
 */
const FormattedCopilotMessage: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let lineIdx = 0;
  let itemCounter = 1;
  let sectionCounter = 1;

  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    const trimmed = line.trim();

    // 1. Empty lines
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // 2. Markdown Table Detection: lines starting and ending with '|'
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (
        lineIdx < rawLines.length &&
        rawLines[lineIdx].trim().startsWith('|') &&
        rawLines[lineIdx].trim().endsWith('|')
      ) {
        tableLines.push(rawLines[lineIdx].trim());
        lineIdx++;
      }

      if (tableLines.length >= 2) {
        // First line is header
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim().replace(/\*\*/g, ''));

        // Skip separator row (tableLines[1])
        const dataRows = tableLines.slice(2).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        blocks.push(
          <div
            key={`table-${lineIdx}`}
            className="overflow-x-auto my-3 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] bg-white"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FEF08A] border-b-2 border-[#0F172A]">
                  {headerCells.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 font-mono font-black text-[11px] uppercase tracking-wider text-[#0F172A] border-r border-[#0F172A] last:border-r-0 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`transition-colors ${
                      rIdx % 2 === 0
                        ? 'bg-white hover:bg-yellow-50/40'
                        : 'bg-slate-50/80 hover:bg-yellow-50/40'
                    }`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
                      >
                        {renderTableCellContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Genuine Major Section Heading Detection ONLY
    // e.g. "### 🌟 Section Title" or "## Section" or "**SECTION 1: TITLE**"
    const isHashHeader = /^(#{1,3})\s+(.+)$/.test(trimmed);
    const isExplicitSection = /^(\*\*)?(SECTION|PART)\s+\d+:?\s*(.+?)(\*\*)?$/i.test(trimmed);

    if (isHashHeader || isExplicitSection) {
      const sectionNum = String(sectionCounter++);
      const sectionTitle = trimmed
        .replace(/^(#{1,3})\s*/, '')
        .replace(/^(\*\*)?(SECTION|PART)\s*\d+:?\s*/i, '')
        .replace(/\*\*/g, '')
        .trim();

      itemCounter = 1; // reset list counter for new section

      blocks.push(
        <div
          key={`sec-${lineIdx}`}
          className="flex items-center gap-2 mt-4 mb-2 pb-1 border-b-2 border-[#0F172A]"
        >
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 border border-[#0F172A] bg-[#0F172A] text-white font-mono font-black text-[10px]">
            PART {sectionNum}
          </span>
          <h4 className="font-black text-xs text-[#0F172A] uppercase tracking-wide">
            {sectionTitle}
          </h4>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 4. List Items with Numbers or Bullets:
    // e.g. 1. Title: ... or * Title: ... or • Title: ... or - Title: ...
    const isBulletOrNumbered = /^([\*\-•]\s+|\d+[\.\)]\s+)/.test(trimmed);
    if (isBulletOrNumbered) {
      // Strip bullet prefix
      const contentWithoutBullet = trimmed.replace(/^([\*\-•]\s+|\d+[\.\)]\s+)/, '');
      const currentNumber = itemCounter++;

      blocks.push(
        <div
          key={`item-${lineIdx}`}
          className="flex items-start gap-2.5 my-1.5 py-0.5 px-0.5"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#0F172A] bg-[#FEF08A] font-mono font-black text-[11px] text-[#0F172A] shadow-[1px_1px_0px_#0F172A]">
            {currentNumber}
          </span>
          <div className="text-xs sm:text-[13px] leading-relaxed text-slate-800 flex-1 font-medium">
            {renderItemContent(contentWithoutBullet)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 5. Normal text paragraphs
    blocks.push(
      <p
        key={`p-${lineIdx}`}
        className="my-1.5 text-xs sm:text-[13px] leading-relaxed text-slate-800 font-medium"
      >
        {renderCleanInline(trimmed)}
      </p>
    );
    lineIdx++;
  }

  return <div className="space-y-0.5">{blocks}</div>;
};

export const TeacherAiAssistant: React.FC = () => {
  const { user } = useAuth();

  // Scope & Assignments
  const [summaryData, setSummaryData] = useState<TeacherCopilotSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Chat Conversation
  const [messages, setMessages] = useState<TeacherCopilotMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio / Speech State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load teacher summary & context on mount or scope change
  const loadSummary = async (classId?: string, sectionId?: string, subjectId?: string) => {
    try {
      setLoadingSummary(true);
      const res = await api.getTeacherCopilotSummary({
        teacher_id: user?.id,
        class_id: classId || selectedClassId || undefined,
        section_id: sectionId || selectedSectionId || undefined,
        subject_id: subjectId || selectedSubjectId || undefined,
      });

      if (res?.success && res.data) {
        setSummaryData(res.data);
        if (!selectedClassId && res.data.activeScope.classId) {
          setSelectedClassId(res.data.activeScope.classId);
        }
        if (!selectedSectionId && res.data.activeScope.sectionId) {
          setSelectedSectionId(res.data.activeScope.sectionId);
        }
        if (!selectedSubjectId && res.data.activeScope.subjectId) {
          setSelectedSubjectId(res.data.activeScope.subjectId);
        }
      }
    } catch (err) {
      console.error('Failed to load teacher copilot summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadSummary();
    return () => {
      stopNovaSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Initialize welcome message once summary is loaded
  useEffect(() => {
    if (summaryData && messages.length === 0) {
      const clsName = summaryData.activeScope.className || 'Class 1';
      const secName = summaryData.activeScope.sectionName || '1-A';
      const subName = summaryData.activeScope.subjectName || 'English';

      const welcomeMsg: TeacherCopilotMessage = {
        id: 'welcome-msg',
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hello ${user?.full_name || 'Teacher'}! I am your **Live Teacher AI Copilot**. I have synced all live records for **${clsName} (${secName}) - ${subName}**.\n\nI can instantly analyze student scores, track absentees, evaluate pending homework, check your schedule, and proactively suggest pedagogical interventions so you spend less time searching and more time teaching!`,
        dataCards: [
          {
            label: 'Class Average',
            value: `${summaryData.metrics.averageScore}%`,
            status: summaryData.metrics.averageScore >= 70 ? 'good' : 'warning',
            trend: 'neutral',
            subtext: `${summaryData.metrics.totalEnrolled} students enrolled`,
          },
          {
            label: "Today's Attendance",
            value: `${summaryData.metrics.todayAttendanceRate}%`,
            status: summaryData.metrics.absentCount > 0 ? 'warning' : 'good',
            subtext: `${summaryData.metrics.absentCount} absent today`,
          },
          {
            label: 'At-Risk Students',
            value: summaryData.metrics.atRiskCount,
            status: summaryData.metrics.atRiskCount > 0 ? 'danger' : 'good',
            subtext: 'Scored below 60%',
          },
          {
            label: 'Pending Homework',
            value: summaryData.metrics.pendingHomeworkCount,
            status: summaryData.metrics.pendingHomeworkCount > 0 ? 'warning' : 'good',
            subtext: 'Unsubmitted tasks',
          },
        ],
        alerts: summaryData.metrics.atRiskCount > 0
          ? [
              {
                type: 'warning',
                title: `${summaryData.metrics.atRiskCount} Students Need Remedial Attention`,
                description: `Students like ${summaryData.atRiskStudents.map((s) => s.name).join(', ') || 'some learners'} have test scores under 60%.`,
                actionPrompt: 'Show at-risk students and remedial recommendations',
              },
            ]
          : [],
        suggestedQuestions: [
          'Which students scored below 60% in the last test?',
          'Who is absent today and what did they miss?',
          'Show homework submission status for this class',
          "What is my teaching timetable for today?",
          'Draft a WhatsApp notice for upcoming class test',
        ],
      };

      setMessages([welcomeMsg]);
    }
  }, [summaryData]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Speech recognition is not supported in this browser. Please type your query.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      stopNovaSpeech();
      setActiveSpeakingId(null);

      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening to your voice... Speak now.');
      };

      recognizer.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceNotice(`Speech signal: ${event.error}`);
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      recognizer.onend = () => {
        setIsListening(false);
        setVoiceNotice(null);
      };

      recognitionRef.current = recognizer;
      recognizer.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Handle Send Query
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isSubmitting) return;

    setInput('');
    stopNovaSpeech();
    setActiveSpeakingId(null);

    const userMsg: TeacherCopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'teacher',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSubmitting(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        sender: m.sender === 'teacher' ? ('teacher' as const) : ('assistant' as const),
        text: m.text,
      }));

      const res = await api.askTeacherCopilot({
        teacher_id: user?.id,
        class_id: selectedClassId,
        section_id: selectedSectionId,
        subject_id: selectedSubjectId,
        message: textToSend,
        history,
      });

      if (res?.success && res.data) {
        const copilotResponse: TeacherCopilotResponse = res.data;
        const newMsgId = `copilot-${Date.now()}`;

        const aiMsg: TeacherCopilotMessage = {
          id: newMsgId,
          sender: 'copilot',
          text: copilotResponse.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dataCards: copilotResponse.dataCards,
          alerts: copilotResponse.actionableAlerts,
          suggestedQuestions: copilotResponse.suggestedQuestions,
          contextSummary: copilotResponse.contextSummary,
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Auto read-aloud if enabled
        if (autoSpeak) {
          playSpeech(aiMsg.text, newMsgId);
        }
      }
    } catch (err: any) {
      console.error('Failed to get answer from Teacher Copilot:', err);
      const errorMsg: TeacherCopilotMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: `I encountered an unexpected issue fetching this record: ${err.message || 'Server error'}. Please try asking again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'Show at-risk students in this class',
          'Who is absent today?',
          'Show my timetable for today',
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Play Speech
  const playSpeech = (text: string, id: string) => {
    if (activeSpeakingId === id) {
      stopNovaSpeech();
      setActiveSpeakingId(null);
      return;
    }

    stopNovaSpeech();
    setActiveSpeakingId(id);

    speakWithNovaVoice(text, {
      rate: 1.0,
      pitch: 1.05,
      onEnd: () => {
        setActiveSpeakingId(null);
      },
      onError: () => {
        setActiveSpeakingId(null);
      },
    });
  };

  // Copy Message to Clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Change Scope
  const handleScopeChange = (clsId: string, secId: string, subId: string) => {
    setSelectedClassId(clsId);
    setSelectedSectionId(secId);
    setSelectedSubjectId(subId);
    loadSummary(clsId, secId, subId);
  };

  // Clear Chat
  const handleClearChat = () => {
    stopNovaSpeech();
    setActiveSpeakingId(null);
    setMessages([]);
    loadSummary();
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] pb-12">
      {/* Top Header Banner */}
      <div className="border-b-4 border-[#0F172A] bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Badge */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center border-3 border-[#0F172A] bg-[#FEF08A] shadow-[3px_3px_0px_#0F172A]">
                  <Bot className="h-7 w-7 text-[#0F172A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-black text-2xl tracking-tight text-[#0F172A] sm:text-3xl">
                      Teacher AI Copilot
                    </h1>
                    <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#A7F3D0] px-2.5 py-0.5 text-xs font-black uppercase text-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#059669]" />
                      LIVE AI 24/7
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-600 sm:text-sm">
                    Query student mastery, absentees, homework, schedules & auto-reduce teaching workload
                  </p>
                </div>
              </div>
            </div>

            {/* Scope Selector Ribbon & Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Teaching Scope Selectors */}
              {summaryData?.assignments && summaryData.assignments.length > 0 && (
                <div className="flex items-center gap-1.5 border-3 border-[#0F172A] bg-[#FEFCE8] px-3 py-1.5 shadow-[3px_3px_0px_#0F172A]">
                  <School className="h-4 w-4 text-[#0F172A]" />
                  <span className="font-black text-xs text-[#0F172A]">SCOPE:</span>
                  <select
                    value={`${selectedClassId}|${selectedSectionId}|${selectedSubjectId}`}
                    onChange={(e) => {
                      const [cls, sec, sub] = e.target.value.split('|');
                      handleScopeChange(cls, sec, sub);
                    }}
                    className="cursor-pointer bg-transparent font-black text-xs text-[#0F172A] outline-hidden"
                  >
                    {summaryData.assignments.map((a) => (
                      <option
                        key={`${a.class_id}-${a.section_id}-${a.subject_id}`}
                        value={`${a.class_id}|${a.section_id}|${a.subject_id}`}
                      >
                        {a.class_name} ({a.section_name}) — {a.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Refresh Snapshot */}
              <button
                onClick={() => loadSummary()}
                disabled={loadingSummary}
                title="Refresh Live School Data"
                className="flex items-center gap-1.5 border-3 border-[#0F172A] bg-white px-3 py-1.5 font-black text-xs text-[#0F172A] shadow-[3px_3px_0px_#0F172A] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingSummary ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">REFRESH</span>
              </button>

              {/* Auto Speak Toggle */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                title={autoSpeak ? 'Auto-Voice Enabled' : 'Auto-Voice Disabled'}
                className={`flex items-center gap-1.5 border-3 border-[#0F172A] px-3 py-1.5 font-black text-xs text-[#0F172A] shadow-[3px_3px_0px_#0F172A] transition-all hover:translate-x-[1px] hover:translate-y-[1px] ${
                  autoSpeak ? 'bg-[#FED7AA]' : 'bg-slate-100'
                }`}
              >
                {autoSpeak ? <Volume2 className="h-4 w-4 text-[#C2410C]" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                <span className="hidden sm:inline">VOICE: {autoSpeak ? 'ON' : 'OFF'}</span>
              </button>

              {/* Clear Chat */}
              <button
                onClick={handleClearChat}
                title="Reset Conversation"
                className="flex items-center gap-1.5 border-3 border-[#0F172A] bg-white px-3 py-1.5 font-black text-xs text-[#DC2626] shadow-[3px_3px_0px_#0F172A] transition-all hover:bg-red-50 hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">CLEAR</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Snapshot Ribbon */}
          {summaryData && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div className="border-3 border-[#0F172A] bg-[#FEFCE8] p-3 shadow-[3px_3px_0px_#0F172A]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">Enrolled</span>
                  <Users className="h-4 w-4 text-[#0F172A]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#0F172A]">
                  {summaryData.metrics.totalEnrolled}
                </div>
                <div className="font-bold text-[10px] text-slate-600">Students in scope</div>
              </div>

              <div className="border-3 border-[#0F172A] bg-[#EFF6FF] p-3 shadow-[3px_3px_0px_#0F172A]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">Class Average</span>
                  <Award className="h-4 w-4 text-[#2563EB]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#2563EB]">
                  {summaryData.metrics.averageScore}%
                </div>
                <div className="font-bold text-[10px] text-slate-600">Based on recent tests</div>
              </div>

              <div
                className={`border-3 border-[#0F172A] p-3 shadow-[3px_3px_0px_#0F172A] ${
                  summaryData.metrics.absentCount > 0 ? 'bg-[#FEF2F2]' : 'bg-[#ECFDF5]'
                }`}
              >
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">Attendance</span>
                  <Calendar className="h-4 w-4 text-[#0F172A]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#0F172A]">
                  {summaryData.metrics.todayAttendanceRate}%
                </div>
                <div className="font-bold text-[10px] text-red-600">
                  {summaryData.metrics.absentCount} absent today
                </div>
              </div>

              <div
                className={`border-3 border-[#0F172A] p-3 shadow-[3px_3px_0px_#0F172A] ${
                  summaryData.metrics.atRiskCount > 0 ? 'bg-[#FFF7ED]' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">At-Risk</span>
                  <AlertTriangle className="h-4 w-4 text-[#EA580C]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#EA580C]">
                  {summaryData.metrics.atRiskCount}
                </div>
                <div className="font-bold text-[10px] text-slate-600">Scored under 60%</div>
              </div>

              <div className="border-3 border-[#0F172A] bg-[#FAF5FF] p-3 shadow-[3px_3px_0px_#0F172A]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">Homework</span>
                  <ClipboardList className="h-4 w-4 text-[#7E22CE]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#7E22CE]">
                  {summaryData.metrics.pendingHomeworkCount}
                </div>
                <div className="font-bold text-[10px] text-slate-600">Pending submissions</div>
              </div>

              <div className="border-3 border-[#0F172A] bg-white p-3 shadow-[3px_3px_0px_#0F172A]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-black text-[11px] uppercase">Schedule</span>
                  <Clock className="h-4 w-4 text-[#0F172A]" />
                </div>
                <div className="mt-1 font-black text-2xl text-[#0F172A]">
                  {summaryData.metrics.todayScheduleSlots}
                </div>
                <div className="font-bold text-[10px] text-slate-600">Slots today</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
        {/* Workload Reducer Quick Action Buttons */}
        <div className="mb-6 rounded-none border-3 border-[#0F172A] bg-[#FEFCE8] p-4 shadow-[4px_4px_0px_#0F172A]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#CA8A04]" />
              <span className="font-black text-xs uppercase tracking-wider text-[#0F172A]">
                1-Click Workload Reducer Prompts
              </span>
            </div>
            <span className="hidden text-[11px] font-bold text-slate-600 sm:inline">
              Click any question to instantly fetch live records
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              {
                label: '⚡ Auto-Schedule Test & Notify Students/Parents',
                query: 'Create a question for this class and subject English, Section 1-A, publish the test tomorrow at 10:00 AM with 25 marks, and send alert notifications to students and parents.',
              },
              {
                label: '🚨 Struggling Students (<60%)',
                query: 'Which students scored below 60% in the last test, and what are their specific weak topics?',
              },
              {
                label: '📋 Absent Today & Details',
                query: 'Who is absent today in my assigned class, and what topics or homework will they miss?',
              },
              {
                label: '📅 My Schedule Today',
                query: 'What is my teaching timetable and classroom schedule for today?',
              },
              {
                label: '📝 Homework Status',
                query: 'Which students have not submitted their homework for this class?',
              },
              {
                label: '💡 Weak Grammar Topics',
                query: 'What are the most common weak topics or difficult questions in recent student attempts?',
              },
              {
                label: '✉️ Draft WhatsApp Notice',
                query: 'Draft a short, polite WhatsApp notice to parents informing them of an upcoming English test.',
              },
              {
                label: '🎯 3 Remedial Questions',
                query: 'Generate 3 simple remedial practice questions targeting the weakest topic for this class.',
              },
              {
                label: '📖 Lesson Plan Next Period',
                query: 'Generate a 40-minute engaging lesson plan for my next period with interactive activities.',
              },
            ].map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill.query)}
                disabled={isSubmitting}
                className="border-2 border-[#0F172A] bg-white px-3 py-1.5 font-bold text-xs text-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all hover:bg-[#FEF08A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0F172A] disabled:opacity-50"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="border-3 border-[#0F172A] bg-white shadow-[6px_6px_0px_#0F172A]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b-3 border-[#0F172A] bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              <span className="font-black text-xs text-[#0F172A]">LIVE DATA ASSISTANT</span>
              <span className="text-slate-400">|</span>
              <span className="font-bold text-xs text-slate-600">
                Connected to School DB & Groq AI
              </span>
            </div>

            {voiceNotice && (
              <div className="rounded-none border border-[#0F172A] bg-[#FEF08A] px-2 py-0.5 font-black text-[11px] text-[#0F172A] animate-pulse">
                {voiceNotice}
              </div>
            )}
          </div>

          {/* Conversation Scroll Container */}
          <div className="max-h-[620px] min-h-[420px] overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#FAFAF9]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'teacher';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="font-black text-xs text-[#0F172A]">
                      {isUser ? user?.full_name || 'You (Teacher)' : 'AI Copilot'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] border-3 border-[#0F172A] p-4 shadow-[4px_4px_0px_#0F172A] ${
                      isUser
                        ? 'bg-[#EFF6FF] text-[#0F172A]'
                        : 'bg-white text-[#0F172A]'
                    }`}
                  >
                    {/* Assistant Message Actions Header */}
                    {!isUser && (
                      <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Bot className="h-4 w-4 text-[#CA8A04]" />
                          <span className="font-black text-[11px] text-slate-600 uppercase">
                            Academic & Operational Answer
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Audio TTS Button */}
                          <button
                            onClick={() => playSpeech(msg.text, msg.id)}
                            title={activeSpeakingId === msg.id ? 'Stop Voice' : 'Listen with Voice'}
                            className={`flex items-center gap-1 border-2 border-[#0F172A] px-2 py-0.5 text-[10px] font-black uppercase transition-all shadow-[1px_1px_0px_#0F172A] ${
                              activeSpeakingId === msg.id
                                ? 'bg-[#FED7AA] text-[#C2410C] animate-pulse'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {activeSpeakingId === msg.id ? (
                              <>
                                <VolumeX className="h-3 w-3" /> STOP
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3" /> LISTEN
                              </>
                            )}
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            title="Copy to clipboard"
                            className="flex items-center gap-1 border-2 border-[#0F172A] bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700 shadow-[1px_1px_0px_#0F172A] hover:bg-slate-200"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" /> COPIED
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> COPY
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text Body with Clean Markdown & Numbered List Rendering */}
                    {isUser ? (
                      <div className="whitespace-pre-line text-sm leading-relaxed font-bold text-[#0F172A]">
                        {msg.text}
                      </div>
                    ) : (
                      <FormattedCopilotMessage content={msg.text} />
                    )}

                    {/* Visual Data Cards (if returned by AI) */}
                    {msg.dataCards && msg.dataCards.length > 0 && (
                      <div className="mt-6 pt-3.5 border-t-2 border-slate-200">
                        <div className="flex items-center gap-1.5 mb-2.5 font-mono font-black text-[11px] uppercase tracking-wider text-slate-600">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          <span>LIVE DATABASE METRICS SNAPSHOT</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {msg.dataCards.map((card, cIdx) => (
                            <div
                              key={cIdx}
                              className={`border-2 border-[#0F172A] p-3 shadow-[2px_2px_0px_#0F172A] flex flex-col justify-between ${
                                card.status === 'danger'
                                  ? 'bg-[#FEF2F2]'
                                  : card.status === 'warning'
                                  ? 'bg-[#FFFBEB]'
                                  : card.status === 'good'
                                  ? 'bg-[#ECFDF5]'
                                  : 'bg-[#EFF6FF]'
                              }`}
                            >
                              <div className="text-[10px] font-mono font-black uppercase text-slate-600 truncate">
                                {card.label}
                              </div>
                              <div className="my-1 text-xl sm:text-2xl font-mono font-black text-[#0F172A]">
                                {card.value}
                              </div>
                              {card.subtext ? (
                                <div className="text-[10px] font-bold text-slate-500 truncate">
                                  {card.subtext}
                                </div>
                              ) : (
                                <div className="text-[10px] font-mono font-bold text-slate-400">
                                  School DB Verified
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actionable Alerts (if any) */}
                    {msg.alerts && msg.alerts.length > 0 && (
                      <div className="mt-5 space-y-2.5">
                        {msg.alerts.map((alert, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex flex-col gap-1.5 border-2 border-[#0F172A] bg-[#FEF2F2] p-3 shadow-[2px_2px_0px_#0F172A]"
                          >
                            <div className="flex items-center gap-1.5 font-black text-xs text-red-700">
                              <AlertTriangle className="h-4 w-4" />
                              {alert.title}
                            </div>
                            <div className="text-xs font-semibold text-slate-700">
                              {alert.description}
                            </div>
                            {alert.actionPrompt && (
                              <button
                                onClick={() => handleSendMessage(alert.actionPrompt)}
                                className="mt-1 self-start border border-[#0F172A] bg-white px-2.5 py-1 text-[11px] font-black text-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-[#FEF08A] transition-colors"
                              >
                                ⚡ Take Action: {alert.actionPrompt}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proactive Follow-up Questions for the Teacher */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-6 border-t-2 border-slate-200 pt-3.5">
                        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider text-slate-600">
                          <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                          <span>PROACTIVE WORKLOAD-REDUCING ACTIONS:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              disabled={isSubmitting}
                              className="group flex items-center gap-2 border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-1.5 text-left text-xs font-bold text-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all hover:bg-[#FEF08A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0F172A] disabled:opacity-50"
                            >
                              <span className="font-mono text-indigo-600 font-black text-[11px]">⚡</span>
                              <span>{q}</span>
                              <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-[#0F172A] transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Querying Indicator */}
            {isSubmitting && (
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center border-2 border-[#0F172A] bg-[#FEF08A] shadow-[2px_2px_0px_#0F172A]">
                  <Bot className="h-4 w-4 animate-spin text-[#0F172A]" />
                </div>
                <div className="border-3 border-[#0F172A] bg-white p-3 shadow-[3px_3px_0px_#0F172A]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F172A]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F172A] [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F172A] [animation-delay:0.4s]" />
                    <span className="ml-2 font-black text-xs text-[#0F172A]">
                      Querying school database & generating pedagogical insights...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Voice Controls Footer */}
          <div className="border-t-3 border-[#0F172A] bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Voice Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? 'Stop Mic' : 'Speak your question (Web Speech)'}
                className={`flex h-12 w-12 shrink-0 items-center justify-center border-3 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] transition-all hover:translate-x-[1px] hover:translate-y-[1px] ${
                  isListening
                    ? 'bg-[#EF4444] text-white animate-pulse shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-[#FEF08A] text-[#0F172A] hover:bg-[#FDE047]'
                }`}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... Speak now'
                    : 'Ask anything: "Who scored below 60%?", "Who is absent?", "Draft parent reminder" ...'
                }
                disabled={isSubmitting}
                className="flex-1 border-3 border-[#0F172A] bg-white px-4 py-3 font-bold text-sm text-[#0F172A] shadow-[3px_3px_0px_#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A] disabled:bg-slate-100"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                className="flex h-12 items-center gap-2 border-3 border-[#0F172A] bg-[#22C55E] px-5 font-black text-sm text-[#0F172A] shadow-[3px_3px_0px_#0F172A] transition-all hover:bg-[#16A34A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">ASK AI</span>
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>
                💡 Pro-tip: Click any follow-up question chip or speak using the microphone.
              </span>
              <span>Groq AI + Realtime School DB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TeacherAiAssistant;
