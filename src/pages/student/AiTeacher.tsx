import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { SourceBadge } from '../../components/SourceBadge';
import { NovaAvatar, NovaVoiceState } from '../../components/NovaAvatar';
import { NovaRobotCompanion } from '../../components/NovaRobotCompanion';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  NovaChatMessage,
  NovaAvatarExpression,
  Subject,
  TeachBackEvaluationResult,
  CameraAnalysisResult,
  NovaChatSession,
} from '../../types';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Bot,
  BookOpen,
  Brain,
  Award,
  Layers,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Square,
  Radio,
  RotateCcw,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Download,
  Check,
  History,
} from 'lucide-react';

type InteractionChannel = 'text' | 'voice' | 'live';

export const stripEmojis = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{200D}\u{20E3}]/gu, '')
    .replace(/\s+([.,!?:;])/g, (_m, p) => p)
    .replace(/[^\S\r\n]{2,}/g, ' ')
    .trim();
};

export const AiTeacher: React.FC = () => {
  const { user } = useAuth();

  // ==========================================
  // 1. CURRICULUM, SUBJECT & TOPIC STATE
  // ==========================================
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-sci');
  const [selectedTopic, setSelectedTopic] = useState<string>('Photosynthesis & Plant Life');

  // Pedagogical Mode: chat, teach_back, practice, quiz, revision
  const [mode, setMode] = useState<'chat' | 'teach_back' | 'practice' | 'quiz' | 'revision'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<NovaAvatarExpression>('greeting');

  // Teach-Back evaluation state
  const [teachBackResult, setTeachBackResult] = useState<TeachBackEvaluationResult | null>(null);

  // Left Panel Active Tab: 'hub' (Curriculum & Settings) or 'history' (Past Chats)
  const [leftPanelTab, setLeftPanelTab] = useState<'hub' | 'history'>('hub');

  // Storage key for per-student chat sessions
  const storageKey = `nova_chat_sessions_${user?.id || 'default'}`;

  // Past Chat Sessions
  const [sessions, setSessions] = useState<NovaChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(`nova_chat_sessions_${user?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved sessions:', e);
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`nova_chat_sessions_${user?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return `sess-init-${Date.now()}`;
  });

  // Rename & Share states
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState<string>('');
  const [sharingSession, setSharingSession] = useState<NovaChatSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active refs to avoid stale closures in callbacks
  const currentSessionIdRef = useRef(currentSessionId);
  currentSessionIdRef.current = currentSessionId;
  const selectedTopicRef = useRef(selectedTopic);
  selectedTopicRef.current = selectedTopic;
  const selectedSubjectIdRef = useRef(selectedSubjectId);
  selectedSubjectIdRef.current = selectedSubjectId;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // ==========================================
  // 2. RESIZABLE & COLLAPSIBLE LEFT PANEL
  // ==========================================
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nova_panel_width');
      const parsed = saved ? parseInt(saved, 10) : 290;
      return isNaN(parsed) || parsed < 220 || parsed > 480 ? 290 : parsed;
    } catch {
      return 290;
    }
  });

  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nova_panel_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Resize drag handler
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!mainContainerRef.current) return;
      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const rawWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.max(220, Math.min(480, rawWidth));
      setPanelWidth(clampedWidth);
      try {
        localStorage.setItem('nova_panel_width', clampedWidth.toString());
      } catch (err) {
        console.warn('Could not save panel width:', err);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const togglePanelCollapse = () => {
    setIsPanelCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nova_panel_collapsed', next.toString());
      } catch (err) {
        console.warn('Could not save panel collapse state:', err);
      }
      return next;
    });
  };

  // ==========================================
  // 3. REAL-TIME VOICE & INTERACTION STATES
  // ==========================================
  const [channelMode, setChannelMode] = useState<InteractionChannel>('text');
  const [voiceState, setVoiceState] = useState<NovaVoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceErrorNotice, setVoiceErrorNotice] = useState<string | null>(null);

  // Active refs to avoid stale closures in Web Speech callbacks
  const recognitionRef = useRef<any>(null);
  const channelModeRef = useRef<InteractionChannel>(channelMode);
  channelModeRef.current = channelMode;
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const loadingRef = useRef<boolean>(loading);
  loadingRef.current = loading;
  const isSubmittingRef = useRef<boolean>(false);

  // Preferred synthesized voice cache
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load available speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const best =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny') ||
              v.name.includes('Aria'))
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      cachedVoiceRef.current = best;
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Text-To-Speech function: Only plays automatically when in voice or live mode, or on explicit button click
  const speakText = useCallback(
    (text: string, messageId?: string, isManualListenClick = false) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      // In TEXT mode, never automatically speak unless student explicitly clicked listen on that message
      if (channelModeRef.current === 'text' && !isManualListenClick) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setVoiceState('idle');
        return;
      }

      // If user toggled voice off, don't speak
      if (!audioEnabled && !isManualListenClick) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setVoiceState('idle');
        return;
      }

      // Clean out emojis and markdown symbols so speech engine pronounces clean sentences without reading emojis
      const cleanText = stripEmojis(text)
        .replace(/[*#_`~]/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/\n\n+/g, '. ')
        .replace(/\n/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      if (cachedVoiceRef.current) {
        utterance.voice = cachedVoiceRef.current;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceState('speaking');
        if (messageId) setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        // In LIVE mode: automatically resume listening so student can speak seamlessly
        if (channelModeRef.current === 'live') {
          startListeningSafely();
        } else {
          setVoiceState('idle');
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (channelModeRef.current === 'live') {
          startListeningSafely();
        } else {
          setVoiceState('idle');
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [audioEnabled]
  );

  // Natural Interruption: Stop NOVA immediately and start listening to the student
  const interruptNova = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    if (channelModeRef.current === 'live' || channelModeRef.current === 'voice') {
      startListeningSafely();
    } else {
      setVoiceState('idle');
    }
  }, []);

  // Safe Speech Recognition Starter
  const startListeningSafely = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setVoiceErrorNotice(null);
      recognitionRef.current.start();
      setVoiceState('listening');
    } catch (err: any) {
      // If already started or pending, quietly handle
      if (err.name !== 'InvalidStateError') {
        console.warn('Speech recognition start note:', err);
      }
    }
  }, []);

  const stopListeningSafely = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignored
    }
    setInterimTranscript('');
    if (!isSpeakingRef.current && !loadingRef.current) {
      setVoiceState('idle');
    }
  }, []);

  // ==========================================
  // 4. OPTIONAL CAMERA (PRIVACY-PRESERVING)
  // ==========================================
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraAnalysis, setCameraAnalysis] = useState<CameraAnalysisResult | null>(null);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [isCompanionExpanded, setIsCompanionExpanded] = useState(true);
  const [showMobileCompanion, setShowMobileCompanion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraActive(false);
      setCameraAnalysis(null);
      setCameraNotice('Camera disabled. NOVA continues via text and voice.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setCameraNotice('Live reaction monitor active. NOVA adapts explanations to your facial reactions.');
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraNotice('Camera optional. NOVA operates 100% through text & real-time voice.');
      setCameraActive(false);
    }
  };

  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!videoRef.current || !mediaStreamRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.6);

      const res = await api.analyzeCameraFrame({
        image_base64: base64,
        student_id: user?.id,
        context: 'study_presence',
      });
      setCameraAnalysis(res.analysis);

      // Dynamically react based on detected facial emotion
      if (res.analysis?.student_reaction === 'confused') {
        setCurrentExpression('concerned');
      } else if (res.analysis?.student_reaction === 'happy') {
        setCurrentExpression('celebrating');
      } else if (res.analysis?.student_reaction === 'thinking') {
        setCurrentExpression('thinking');
      } else if (res.analysis?.student_reaction === 'focused') {
        setCurrentExpression('explaining');
      }
    } catch (err) {
      console.warn('Frame capture notice:', err);
    }
  }, [user?.id]);

  // Periodic student reaction monitor when camera is active
  useEffect(() => {
    if (!cameraActive) return;

    // Fast initial frame analysis
    const initialTimer = setTimeout(() => {
      captureAndAnalyzeFrame();
    }, 1200);

    // Continuous loop every 7 seconds
    const interval = setInterval(() => {
      captureAndAnalyzeFrame();
    }, 7000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [cameraActive, captureAndAnalyzeFrame]);

  // Keep videoRef srcObject in sync when video element mounts
  useEffect(() => {
    if (cameraActive && mediaStreamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive]);

  // ==========================================
  // 5. STUDY SESSION TRACKING & HEARTBEAT
  // ==========================================
  const [studySeconds, setStudySeconds] = useState(0);
  const activeTimerRef = useRef<any>(null);

  useEffect(() => {
    let currentSessId: string | null = null;

    api
      .startStudySession({
        student_id: user?.id,
        subject_id: selectedSubjectId,
        topic: selectedTopic,
        activity_type: mode === 'teach_back' ? 'teach_back' : 'ai_interaction',
      })
      .then((res) => {
        currentSessId = res.session_id;
      })
      .catch(console.error);

    activeTimerRef.current = setInterval(() => {
      setStudySeconds((prev) => prev + 15);
      if (currentSessId) {
        api.sendStudyHeartbeat({ session_id: currentSessId, active_seconds_delta: 15 });
      }
    }, 15000);

    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
      if (currentSessId) {
        api.endStudySession({ session_id: currentSessId });
      }
    };
  }, [selectedSubjectId]);

  // ==========================================
  // 6. MESSAGES, SESSIONS & CHAT ENGINE
  // ==========================================
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<NovaChatMessage[]>([
    {
      id: 'init-welcome',
      sender: 'nova',
      text: `Hello ${user?.full_name || 'Scholar'}! I am NOVA, your AI Learning Companion.\n\nI can help you master complex subjects step-by-step. You can talk to me directly in real-time voice, explore concepts socratically, or try **"Explain it to NOVA"** to verify conceptual reasoning in your own words!`,
      expression: 'greeting',
      suggestedFollowUps: [
        'How do plants synthesize food using sunlight?',
        'Can I explain photosynthesis in my own words?',
        'Give me a challenging real-life concept question',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, interimTranscript]);

  // Feedback Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Safe Session Storage Writer
  const saveSessionsToStorage = useCallback(
    (updated: NovaChatSession[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save chat sessions:', err);
      }
    },
    [storageKey]
  );

  // Initialize or restore active session on mount
  useEffect(() => {
    if (sessions.length === 0) {
      const welcomeMsg: NovaChatMessage = {
        id: 'init-welcome',
        sender: 'nova',
        text: `Hello ${user?.full_name || 'Scholar'}! I am NOVA, your AI Learning Companion.\n\nI can help you master complex subjects step-by-step. You can talk to me directly in real-time voice, explore concepts socratically, or try **"Explain it to NOVA"** to verify conceptual reasoning in your own words!`,
        expression: 'greeting',
        suggestedFollowUps: [
          'How do plants synthesize food using sunlight?',
          'Can I explain photosynthesis in my own words?',
          'Give me a challenging real-life concept question',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const initialSession: NovaChatSession = {
        id: `sess-${Date.now()}`,
        title: 'Photosynthesis & Plant Life Discussion',
        subject_id: selectedSubjectId || 'sub-sci',
        subject_name: 'Science',
        topic: 'Photosynthesis & Plant Life',
        mode: 'chat',
        messages: [welcomeMsg],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
      setMessages([welcomeMsg]);
      saveSessionsToStorage([initialSession]);
    } else {
      const active = sessions.find((s) => s.id === currentSessionId) || sessions[0];
      if (active) {
        setCurrentSessionId(active.id);
        setMessages(active.messages);
        if (active.subject_id) setSelectedSubjectId(active.subject_id);
        if (active.topic) setSelectedTopic(active.topic);
        if (active.mode) setMode(active.mode);
      }
    }
  }, []);

  // Sync latest message into currently active chat session
  const appendMessageToCurrentSession = (newMsg: NovaChatMessage) => {
    setSessions((prevSessions) => {
      const updated = prevSessions.map((sess) => {
        if (sess.id === currentSessionIdRef.current) {
          let title = sess.title;
          if (sess.messages.length <= 1 && newMsg.sender === 'student') {
            title = newMsg.text.length > 34 ? newMsg.text.slice(0, 34) + '...' : newMsg.text;
          }
          return {
            ...sess,
            title,
            topic: selectedTopicRef.current,
            subject_id: selectedSubjectIdRef.current,
            subject_name: subjects.find((s) => s.id === selectedSubjectIdRef.current)?.name || sess.subject_name || 'Science',
            mode: modeRef.current,
            messages: [...sess.messages, newMsg],
            updated_at: new Date().toISOString(),
          };
        }
        return sess;
      });
      saveSessionsToStorage(updated);
      return updated;
    });
  };

  // Start a fresh, clean chat session
  const handleCreateNewChat = (customTopic?: string) => {
    const topicToUse = customTopic || selectedTopicRef.current || 'Curriculum Concepts';
    const sub = subjects.find((s) => s.id === selectedSubjectIdRef.current);
    const subName = sub?.name || 'Science';
    const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newWelcome: NovaChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'nova',
      text: `Hello ${user?.full_name || 'Scholar'}! Starting a new learning session on **${topicToUse}** (${subName}). How would you like to explore this topic?`,
      expression: 'greeting',
      suggestedFollowUps: [
        `What are the core fundamentals of ${topicToUse}?`,
        `Ask me a concept question on ${topicToUse}`,
        `Explain ${topicToUse} with a real-world example`,
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newSess: NovaChatSession = {
      id: newId,
      title: `${topicToUse} (${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })})`,
      subject_id: selectedSubjectIdRef.current,
      subject_name: subName,
      topic: topicToUse,
      mode: modeRef.current,
      messages: [newWelcome],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSessions((prev) => {
      const updated = [newSess, ...prev];
      saveSessionsToStorage(updated);
      return updated;
    });

    setCurrentSessionId(newId);
    setMessages([newWelcome]);
    setTeachBackResult(null);
    setInput('');
    interruptNova();

    showToast(`Started new chat: "${newSess.title}"`);
  };

  // Switch between past chat sessions
  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    interruptNova();
    setCurrentSessionId(target.id);
    setMessages(target.messages);
    if (target.subject_id) setSelectedSubjectId(target.subject_id);
    if (target.topic) setSelectedTopic(target.topic);
    if (target.mode) setMode(target.mode);
    setTeachBackResult(null);
    setIsMobileDrawerOpen(false);
  };

  // Delete chat session
  const handleDeleteSession = (sessionId: string) => {
    const toDelete = sessions.find((s) => s.id === sessionId);
    if (!toDelete) return;

    if (!window.confirm(`Delete chat "${toDelete.title}"? This cannot be undone.`)) {
      return;
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    saveSessionsToStorage(remaining);

    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].id);
      } else {
        handleCreateNewChat();
      }
    }

    showToast(`Deleted chat: "${toDelete.title}"`);
  };

  // Rename chat session
  const handleSaveRename = () => {
    if (!renamingSessionId) return;
    const trimmed = renameTitleInput.trim();
    if (!trimmed) {
      setRenamingSessionId(null);
      return;
    }

    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === renamingSessionId
          ? { ...s, title: trimmed, updated_at: new Date().toISOString() }
          : s
      );
      saveSessionsToStorage(updated);
      return updated;
    });

    setRenamingSessionId(null);
    showToast(`Renamed chat to "${trimmed}"`);
  };

  // Generate plain-text/markdown formatted transcript for sharing
  const generateFormattedTranscript = (sess: NovaChatSession): string => {
    return [
      `============================================================`,
      `SMARTSCHOOL // NOVA AI LEARNING TRANSCRIPT`,
      `Session Title: ${sess.title}`,
      `Topic: ${sess.topic}`,
      `Subject: ${sess.subject_name}`,
      `Scholar: ${user?.full_name || 'Scholar'}${user?.id_number ? ` • ${user.id_number}` : ''}`,
      `Date: ${new Date(sess.updated_at).toLocaleString()}`,
      `Messages: ${sess.messages.length}`,
      `============================================================\n`,
      sess.messages
        .map(
          (m) =>
            `[${m.timestamp}] ${m.sender === 'student' ? 'YOU (SCHOLAR)' : 'NOVA MENTOR'}:\n${m.text}` +
            (m.sourceBadge
              ? `\n[Textbook Grounding: ${m.sourceBadge.bookTitle}, Page ${m.sourceBadge.pageNumber}${
                  m.sourceBadge.lessonTitle ? ` - ${m.sourceBadge.lessonTitle}` : ''
                }]`
              : '')
        )
        .join('\n\n'),
      `\n============================================================`,
      `Verified by SmartSchool Academic Platform Grounded RAG`,
      `============================================================`,
    ].join('\n');
  };

  const copyTranscript = async (sess: NovaChatSession) => {
    const text = generateFormattedTranscript(sess);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Chat transcript copied to clipboard!');
      setSharingSession(null);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      showToast('Could not copy to clipboard.');
    }
  };

  const downloadTranscript = (sess: NovaChatSession) => {
    const text = generateFormattedTranscript(sess);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTopic = (sess.topic || 'chat').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `nova_${safeTopic}_transcript.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded chat transcript file!');
    setSharingSession(null);
  };

  const nativeShare = async (sess: NovaChatSession) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `NOVA Study Session: ${sess.title}`,
          text: generateFormattedTranscript(sess),
        });
        showToast('Shared successfully!');
        setSharingSession(null);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }
  };

  // Load curriculum subjects
  useEffect(() => {
    api
      .getSubjects()
      .then((subList) => {
        setSubjects(subList);
        if (subList.length > 0) {
          setSelectedSubjectId(subList[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // ==========================================
  // 7. SEND MESSAGE / SUBMIT TEACH-BACK
  // ==========================================
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loadingRef.current || isSubmittingRef.current) return;

    isSubmittingRef.current = true;

    // Interrupt any ongoing speech if starting a new turn
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }

    const studentMsgId = `msg-stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const studentMsg: NovaChatMessage = {
      id: studentMsgId,
      sender: 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    appendMessageToCurrentSession(studentMsg);
    setInput('');
    setInterimTranscript('');
    setLoading(true);
    setVoiceState('thinking');
    setCurrentExpression('thinking');

    // Teach-Back mode evaluation
    if (mode === 'teach_back') {
      try {
        const result = await api.submitTeachBack({
          student_id: user?.id,
          subject_id: selectedSubjectId,
          topic: selectedTopic,
          student_explanation: textToSend,
          input_mode: channelModeRef.current !== 'text' ? 'voice' : 'text',
        });

        setTeachBackResult(result);
        const expression: NovaAvatarExpression =
          result.understanding_score >= 80 ? 'celebrating' : 'encouraging';
        setCurrentExpression(expression);

        const cleanFeedback = stripEmojis(result.feedback);
        const cleanFollowUps = (result.follow_up_questions || []).map(stripEmojis);

        const novaMsgId = `msg-nova-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const novaResponseMsg: NovaChatMessage = {
          id: novaMsgId,
          sender: 'nova',
          text: cleanFeedback,
          expression,
          suggestedFollowUps: cleanFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, novaResponseMsg]);
        appendMessageToCurrentSession(novaResponseMsg);
        if (channelModeRef.current === 'voice' || channelModeRef.current === 'live') {
          speakText(cleanFeedback, novaMsgId);
        }
      } catch (err: any) {
        console.error(err);
        setCurrentExpression('concerned');
        setVoiceState('error');
        const errMsg: NovaChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'nova',
          text: 'I had trouble evaluating your explanation just now. Please try again or rephrase in your own words.',
          expression: 'concerned',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
        appendMessageToCurrentSession(errMsg);
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    // Standard Socratic Inquiry / Practice / Quiz Mode
    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await api.askNova({
        student_id: user?.id,
        class_id: user?.class_id,
        section_id: user?.section_id,
        subject_id: selectedSubjectId,
        topic: selectedTopic,
        message: textToSend,
        mode,
        student_reaction: cameraAnalysis?.student_reaction,
        history: historyPayload,
      });

      setCurrentExpression(response.expression);

      const cleanAnswer = stripEmojis(response.answer);
      const cleanFollowUps = (response.suggestedFollowUps || []).map(stripEmojis);

      const novaMsgId = `msg-nova-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const aiMsg: NovaChatMessage = {
        id: novaMsgId,
        sender: 'nova',
        text: cleanAnswer,
        expression: response.expression,
        sourceBadge: response.sourceBadge,
        suggestedFollowUps: cleanFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      appendMessageToCurrentSession(aiMsg);
      if (channelModeRef.current === 'voice' || channelModeRef.current === 'live') {
        speakText(cleanAnswer, novaMsgId);
      }
    } catch (err: any) {
      console.error(err);
      setCurrentExpression('concerned');
      setVoiceState('error');
      const fallbackErr: NovaChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'nova',
        text: `I couldn't retrieve that information in the available curriculum context. You can rephrase or ask your teacher for guidance.`,
        expression: 'concerned',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackErr]);
      appendMessageToCurrentSession(fallbackErr);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // ==========================================
  // 8. WEB SPEECH INITIALIZATION (NO DUPLICATION)
  // ==========================================
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceErrorNotice('Browser speech recognition not detected. Typed input remains fully functional.');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onresult = (e: any) => {
      let finalChunk = '';
      let interimChunk = '';

      // Cleanly separate finalized text from interim speech chunks (prevents duplication bug)
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const result = e.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }

      // If student is speaking while NOVA was speaking, interrupt immediately!
      if (interimChunk || finalChunk) {
        if (isSpeakingRef.current || ('speechSynthesis' in window && window.speechSynthesis.speaking)) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        }
      }

      if (interimChunk) {
        setInterimTranscript(interimChunk.trim());
        setVoiceState('listening');
      }

      if (finalChunk.trim()) {
        const finalizedText = finalChunk.trim();
        setInterimTranscript('');

        // If in LIVE mode, auto-submit student speech directly to NOVA!
        if (channelModeRef.current === 'live') {
          handleSendMessage(finalizedText);
        } else {
          // Standard Voice mode: populate input bar cleanly without repeating
          setInput((prev) => (prev ? `${prev} ${finalizedText}` : finalizedText));
          setVoiceState('idle');
        }
      }
    };

    recognizer.onerror = (e: any) => {
      console.warn('Speech error notice:', e.error);
      if (e.error === 'not-allowed') {
        setVoiceState('error');
        setVoiceErrorNotice('Microphone access denied. Please enable microphone permissions in your browser.');
      } else if (e.error !== 'no-speech') {
        setVoiceState('error');
        setVoiceErrorNotice(`Voice signal: ${e.error}`);
      }
    };

    recognizer.onend = () => {
      setInterimTranscript('');
      // In LIVE mode: automatically restart listening if NOVA is not currently speaking or thinking
      if (channelModeRef.current === 'live' && !loadingRef.current && !isSpeakingRef.current) {
        try {
          recognizer.start();
          setVoiceState('listening');
        } catch {
          // Handled
        }
      } else if (!isSpeakingRef.current && !loadingRef.current) {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognizer;

    return () => {
      try {
        recognizer.stop();
      } catch {
        // Handled
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Channel Mode Change Handler
  const handleSelectChannel = (newChannel: InteractionChannel) => {
    setChannelMode(newChannel);
    channelModeRef.current = newChannel;

    if (newChannel === 'live') {
      setAudioEnabled(true);
      interruptNova();
      startListeningSafely();
    } else if (newChannel === 'voice') {
      setAudioEnabled(true);
      startListeningSafely();
    } else {
      stopListeningSafely();
      interruptNova();
      setVoiceState('idle');
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // ==========================================
  // 8. CHAT HISTORY PANEL (RENAME, DELETE, SHARE)
  // ==========================================
  const renderChatHistory = () => (
    <div className="space-y-2">
      {/* Top Action: New Chat Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleCreateNewChat()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-extrabold text-[11px] text-[#0F172A] hover:bg-[#6EE7B7] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>START NEW CHAT</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1 pt-0.5">
        <span className="text-[10px] font-extrabold text-slate-700 uppercase flex items-center gap-1">
          <History className="w-3 h-3 text-[#0F172A]" /> PAST SESSIONS
        </span>
        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] border border-[#0F172A]">
          {sessions.length} SAVED
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-[#0F172A] bg-white text-center space-y-2">
          <p className="text-xs font-bold text-slate-600">No past conversations saved yet.</p>
          <button
            onClick={() => handleCreateNewChat()}
            className="px-2.5 py-1 bg-[#FDE68A] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] text-xs font-extrabold text-[#0F172A]"
          >
            Start First Chat
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sessions.map((sess) => {
            const isActive = sess.id === currentSessionId;
            const isEditing = renamingSessionId === sess.id;
            const formattedDate = new Date(sess.updated_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={sess.id}
                className={`p-2 border-2 border-[#0F172A] transition-all ${
                  isActive
                    ? 'bg-[#FEFCE8] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white hover:bg-slate-50 shadow-[1px_1px_0px_#0F172A]'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={renameTitleInput}
                      onChange={(e) => setRenameTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') setRenamingSessionId(null);
                      }}
                      autoFocus
                      className="w-full text-xs font-bold p-1 bg-white border border-[#0F172A] focus:outline-hidden"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleSaveRename}
                        className="px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-[10px] font-extrabold text-[#0F172A] hover:bg-[#6EE7B7]"
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => setRenamingSessionId(null)}
                        className="px-2 py-0.5 bg-slate-200 border border-[#0F172A] text-[10px] font-bold text-slate-700"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-1">
                      <button
                        onClick={() => handleSelectSession(sess.id)}
                        className="text-left flex-1 font-extrabold text-xs text-[#0F172A] line-clamp-1 hover:underline flex items-center gap-1"
                        title={sess.title}
                      >
                        <MessageSquare className="w-3 h-3 shrink-0 text-slate-700" />
                        <span className="truncate">{sess.title}</span>
                      </button>
                      {isActive && (
                        <span className="shrink-0 text-[8px] font-black px-1 py-0.2 bg-[#0F172A] text-white uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-slate-600 flex-wrap">
                      <span className="px-1 py-0.2 bg-[#E2E8F0] border border-[#0F172A] font-extrabold text-[#0F172A]">
                        {sess.subject_name || 'Science'}
                      </span>
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{sess.messages.length} msgs</span>
                    </div>

                    {/* Action Buttons: Rename, Share, Delete */}
                    <div className="flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingSessionId(sess.id);
                          setRenameTitleInput(sess.title);
                        }}
                        className="p-1 text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 border border-transparent hover:border-[#0F172A] rounded-xs transition-colors"
                        title="Rename chat"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingSession(sess);
                        }}
                        className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-transparent hover:border-[#0F172A] rounded-xs transition-colors"
                        title="Share chat transcript"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.id);
                        }}
                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-400 rounded-xs transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==========================================
  // 9. LEARNING HUB CONTROLS CONTENT (SHARED)
  // ==========================================
  const renderLearningHubControls = () => (
    <div className="space-y-2">
      {/* Subject Selector & Topic Card */}
      <BrutalCard className="p-2 bg-white space-y-1.5">
        <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1">
          <span className="text-[11px] font-extrabold text-[#0F172A] uppercase flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#0F172A]" /> Curriculum Subject
          </span>
          <span className="text-[9px] font-bold text-slate-500">{subjects.length} subjects</span>
        </div>

        {/* 2-Column High-Density Subject Grid */}
        <div className="grid grid-cols-2 gap-1">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubjectId(sub.id);
                if (sub.name.includes('Math')) setSelectedTopic('Fractions & Multi-digit Division');
                else if (sub.name.includes('Science')) setSelectedTopic('Photosynthesis & Plant Life');
                else if (sub.name.includes('English')) setSelectedTopic('Nouns & Sentence Construction');
                else setSelectedTopic(`${sub.name} Core Concepts`);
              }}
              className={`px-1.5 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between truncate text-left ${
                selectedSubjectId === sub.id
                  ? 'bg-[#0F172A] text-white shadow-[1.5px_1.5px_0px_#FDE68A]'
                  : 'bg-white text-[#0F172A] hover:bg-slate-50'
              }`}
              title={sub.name}
            >
              <span className="truncate">{sub.name}</span>
              <span className="text-[9px] opacity-75 shrink-0 ml-1">{sub.code || 'SUB'}</span>
            </button>
          ))}
        </div>

        {/* Topic Input Row */}
        <div className="pt-1.5 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-700 uppercase shrink-0">
              Topic:
            </label>
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 text-[11px] font-bold px-2 py-0.5 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden"
              placeholder="e.g. Photosynthesis"
            />
          </div>
        </div>
      </BrutalCard>

      {/* Learning Mode Switcher */}
      <BrutalCard className="p-2 bg-white space-y-1">
        <span className="text-[11px] font-extrabold text-[#0F172A] uppercase flex items-center gap-1 border-b-2 border-[#0F172A] pb-1">
          <Layers className="w-3.5 h-3.5" /> Interaction Mode
        </span>

        <div className="grid grid-cols-1 gap-1 pt-0.5">
          <button
            onClick={() => setMode('chat')}
            className={`text-left px-2 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'chat'
                ? 'bg-[#C4B5FD] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Socratic Discussion</span>
            <span className="text-[8px] font-extrabold px-1 bg-white border border-[#0F172A]">INQUIRY</span>
          </button>

          <button
            onClick={() => setMode('teach_back')}
            className={`text-left px-2 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'teach_back'
                ? 'bg-[#FDE68A] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Explain it to NOVA</span>
            <span className="text-[8px] font-extrabold px-1 bg-[#A7F3D0] border border-[#0F172A]">MASTERY</span>
          </button>

          <button
            onClick={() => setMode('practice')}
            className={`text-left px-2 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'practice'
                ? 'bg-[#BAE6FD] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Targeted Practice</span>
          </button>

          <button
            onClick={() => setMode('quiz')}
            className={`text-left px-2 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'quiz'
                ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Quick Concept Quiz</span>
          </button>

          <button
            onClick={() => setMode('revision')}
            className={`text-left px-2 py-1 text-[11px] font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'revision'
                ? 'bg-[#FED7AA] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>3-Bullet Revision</span>
          </button>
        </div>
      </BrutalCard>

      {/* Privacy-Preserving Opt-In Camera Monitor Widget */}
      <BrutalCard className="p-2 bg-white space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-[#0F172A] uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Camera (Optional)
          </span>
          <button
            onClick={toggleCamera}
            className={`px-2 py-0.5 border-2 border-[#0F172A] text-[10px] font-extrabold shadow-[1px_1px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] ${
              cameraActive ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-slate-100 text-slate-700'
            }`}
            title="Toggle optional presence camera"
          >
            {cameraActive ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {cameraActive ? (
          <div className="space-y-1.5 pt-1 border-t border-slate-200">
            <div className="relative border border-[#0F172A] bg-black rounded-xs overflow-hidden h-20 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 px-1 py-0.2 bg-red-600 text-white text-[8px] font-extrabold flex items-center gap-1 animate-pulse">
                <span className="w-1 h-1 bg-white rounded-full" /> LIVE
              </div>
            </div>

            <div className="text-[9px] flex justify-between font-bold bg-[#F8FAFC] p-1 border border-[#0F172A]">
              <span>Face Presence:</span>
              <span
                className={
                  cameraAnalysis?.face_detected ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                }
              >
                {cameraAnalysis?.face_detected ? 'DETECTED' : 'MONITORING'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic leading-tight">
            Camera optional. NOVA learns with you via voice and text.
          </p>
        )}

        {cameraNotice && (
          <p className="text-[9px] text-slate-600 bg-slate-50 p-1 border border-slate-300">
            {cameraNotice}
          </p>
        )}
      </BrutalCard>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-0 font-mono select-none overflow-hidden gap-1.5">
      {/* ==========================================
          TOP STATUS & MODE BAR (COMPACT SINGLE-LINE)
         ========================================== */}
      <div className="bg-[#FEFCE8] border-2 border-[#0F172A] px-2.5 py-1 shadow-[2px_2px_0px_#0F172A] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#FDE68A] border border-[#0F172A]">
            <Brain className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-sm text-[#0F172A] tracking-tight">
              NOVA AI COMPANION
            </span>
            <span className="text-[9px] font-extrabold px-1 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
              REAL-TIME VOICE
            </span>
          </div>
          <span className="text-[10px] text-slate-600 hidden md:inline">
            • Cloud AI • Zero GPU • Textbook Grounded
          </span>
        </div>

        {/* Top Controls: Channel Switcher (TEXT | VOICE | LIVE) + Chat History + Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Chat Actions */}
          <button
            onClick={() => handleCreateNewChat()}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] text-xs font-extrabold hover:bg-[#6EE7B7] active:translate-x-[1px] active:translate-y-[1px] text-[#0F172A] shadow-[1px_1px_0px_#0F172A]"
            title="Start a new chat session"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline text-[10px]">NEW CHAT</span>
          </button>

          <button
            onClick={() => {
              if (isPanelCollapsed) setIsPanelCollapsed(false);
              setLeftPanelTab('history');
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white border border-[#0F172A] text-xs font-extrabold hover:bg-[#FDE68A] active:translate-x-[1px] active:translate-y-[1px] text-[#0F172A] shadow-[1px_1px_0px_#0F172A]"
            title="View past chat history"
          >
            <History className="w-3 h-3 text-[#0F172A]" />
            <span className="text-[10px]">HISTORY ({sessions.length})</span>
          </button>

          {/* Interaction Channel Switcher */}
          <div className="flex items-center border border-[#0F172A] bg-white p-0.5">
            <button
              onClick={() => handleSelectChannel('text')}
              className={`px-2 py-0.5 text-[11px] font-extrabold transition-all ${
                channelMode === 'text'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Standard text chat mode"
            >
              TEXT
            </button>
            <button
              onClick={() => handleSelectChannel('voice')}
              className={`px-2 py-0.5 text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                channelMode === 'voice'
                  ? 'bg-[#C4B5FD] text-[#0F172A]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Tap to speak mode"
            >
              <Mic className="w-3 h-3" /> VOICE
            </button>
            <button
              onClick={() => handleSelectChannel('live')}
              className={`px-2 py-0.5 text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                channelMode === 'live'
                  ? 'bg-[#A7F3D0] text-[#0F172A] animate-pulse'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Autonomous real-time voice conversation loop"
            >
              <Radio className="w-3 h-3 text-emerald-700" /> LIVE
            </button>
          </div>

          {/* Mobile Drawer Opener (visible on small screens) */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1 px-2 py-0.5 bg-[#FDE68A] border border-[#0F172A] text-xs font-extrabold active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Menu className="w-3.5 h-3.5 text-[#0F172A]" />
            <span className="text-[10px]">HUB / CHATS</span>
          </button>

          {/* Active Study Timer */}
          <div className="hidden sm:flex items-center gap-1 bg-white px-2 py-0.5 border border-[#0F172A]">
            <Clock className="w-3 h-3 text-[#0F172A] animate-pulse" />
            <span className="text-[10px] font-extrabold text-[#0F172A]">
              {Math.floor(studySeconds / 60)}m {studySeconds % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          MAIN WORKSPACE (SINGLE VIEWPORT CONTAINER)
         ========================================== */}
      <div
        ref={mainContainerRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row w-full bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] overflow-hidden"
      >
        {/* DESKTOP LEFT LEARNING PANEL */}
        {!isPanelCollapsed && (
          <div
            style={{ width: `${panelWidth}px` }}
            className="hidden lg:flex flex-col bg-[#F8FAFC] border-r-2 border-[#0F172A] overflow-y-auto p-2 shrink-0 transition-[width] duration-75 select-text"
          >
            {/* Dual Tabs: LEARNING HUB vs CHATS */}
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1.5 mb-2 gap-1">
              <div className="flex items-center border border-[#0F172A] bg-white p-0.5">
                <button
                  onClick={() => setLeftPanelTab('hub')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    leftPanelTab === 'hub'
                      ? 'bg-[#0F172A] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Curriculum & Settings"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>HUB</span>
                </button>
                <button
                  onClick={() => setLeftPanelTab('history')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    leftPanelTab === 'history'
                      ? 'bg-[#FDE68A] text-[#0F172A]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Past Chat History"
                >
                  <History className="w-3 h-3" />
                  <span>CHATS ({sessions.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCreateNewChat()}
                  className="p-1 bg-[#A7F3D0] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-[#6EE7B7] text-[#0F172A]"
                  title="Start New Chat"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={togglePanelCollapse}
                  className="p-1 bg-white border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-[#FDE68A] active:scale-95 text-[#0F172A]"
                  title="Collapse Learning Panel"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {leftPanelTab === 'hub' ? renderLearningHubControls() : renderChatHistory()}
          </div>
        )}

        {/* TACTILE VERTICAL DRAG DIVIDER (DESKTOP) */}
        {!isPanelCollapsed ? (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`hidden lg:flex flex-col items-center justify-between py-4 w-3 border-r-2 border-[#0F172A] cursor-col-resize select-none shrink-0 transition-colors ${
              isDragging ? 'bg-[#FDE68A]' : 'bg-slate-100 hover:bg-[#C4B5FD]'
            }`}
            title="Drag horizontally to resize learning panel"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePanelCollapse();
              }}
              className="p-0.5 bg-white border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-[#FDE68A] active:scale-90"
              title="Collapse panel"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </button>

            {/* Tactile Grip Bar Dots */}
            <div className="flex flex-col gap-1 items-center opacity-70">
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
            </div>

            <div className="w-1.5 h-1.5 bg-[#0F172A]" />
          </div>
        ) : (
          /* COLLAPSED EXPAND STRIP (DESKTOP) */
          <div className="hidden lg:flex flex-col items-center py-3 px-1 bg-[#FEFCE8] border-r-2 border-[#0F172A] shrink-0">
            <button
              onClick={togglePanelCollapse}
              className="p-1 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-[#FDE68A] text-[#0F172A] mb-3 active:scale-95"
              title="Expand Learning Panel"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-extrabold uppercase text-[#0F172A] [writing-mode:vertical-lr] tracking-widest py-1">
              LEARNING HUB
            </span>
          </div>
        )}

        {/* RIGHT MAIN CONVERSATION AREA */}
        <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
          {/* HEADER BAR: NOVA AVATAR & COMPANION IDENTITY (COMPACT HEIGHT) */}
          <div className="px-3 py-2 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* NOVA AI FACE AVATAR */}
              <NovaAvatar
                expression={currentExpression}
                voiceState={voiceState}
                isSpeaking={isSpeaking}
                isThinking={loading}
                size="compact"
                showLabel={false}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-extrabold text-xs sm:text-sm text-[#0F172A] tracking-tight truncate">
                    NOVA // LEARNING COMPANION
                  </h2>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] border border-[#0F172A]">
                    {currentSubject?.name || 'Science'}
                  </span>
                  <span className="text-[8px] font-extrabold px-1 py-0.2 bg-[#0F172A] text-white border border-[#0F172A] uppercase">
                    {voiceState}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 truncate">
                  Topic: {selectedTopic}
                </p>
              </div>
            </div>

            {/* Header Right: Mobile HUD Toggle, Share Chat, Audio Toggle & Quick Interruption Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mobile Companion HUD Toggle */}
              <button
                onClick={() => setShowMobileCompanion(true)}
                className="lg:hidden flex items-center gap-1 px-2 py-1 text-xs font-extrabold bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] transition-all text-[#0F172A]"
                title="Open Animated AI Companion HUD"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="inline">AI HUD</span>
              </button>

              {/* Share Active Chat */}
              <button
                onClick={() => {
                  const active = sessions.find((s) => s.id === currentSessionId);
                  if (active) setSharingSession(active);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-white hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] transition-all text-[#0F172A]"
                title="Share current chat transcript"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SHARE</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={interruptNova}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-[#FED7AA] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-rose-200 active:scale-95 text-[#0F172A]"
                  title="Interrupt NOVA speech"
                >
                  <Square className="w-3 h-3 fill-[#0F172A]" />
                  <span className="hidden sm:inline">STOP</span>
                </button>
              )}

              <button
                onClick={() => {
                  const next = !audioEnabled;
                  setAudioEnabled(next);
                  if (!next && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setSpeakingMessageId(null);
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  audioEnabled ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-white text-slate-700'
                }`}
                title="Toggle Text-to-Speech audio"
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{audioEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
              </button>
            </div>
          </div>

          {/* Sub-banner: Teach-Back or LIVE Voice Status */}
          {mode === 'teach_back' && (
            <div className="bg-[#FEFCE8] border-b-2 border-[#0F172A] px-3 py-1 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="font-extrabold text-[#0F172A]">"EXPLAIN IT TO NOVA":</span>
                <span className="text-slate-700 font-bold hidden sm:inline">
                  Explain {selectedTopic} in your own words.
                </span>
              </div>
              <Badge variant="lavender">TEACH-BACK</Badge>
            </div>
          )}

          {channelMode === 'live' && (
            <div className="bg-[#ECFDF5] border-b-2 border-[#0F172A] px-3 py-1 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-emerald-900">LIVE VOICE ACTIVE:</span>
                <span className="text-emerald-800 hidden sm:inline">
                  Speak naturally. Say anything to interrupt.
                </span>
              </div>
              <button
                onClick={interruptNova}
                className="text-[10px] font-extrabold underline text-emerald-900 hover:text-rose-700"
              >
                Interrupt Speech
              </button>
            </div>
          )}

          {/* TWO-COLUMN WORKSPACE: CONVERSATION STREAM (LEFT) + ANIMATED AI COMPANION (RIGHT) */}
          <div className="flex-1 min-h-0 flex flex-row overflow-hidden bg-[#F8FAFC]">
            {/* LEFT / CENTER: CONVERSATION STREAM WITH PROPORTIONAL, CRISP TYPOGRAPHY */}
            <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
              {/* SCROLLABLE CONVERSATION STREAM */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                <div className="max-w-3xl w-full mx-auto space-y-4">
                  {messages.map((m) => {
                    const isCurrentlyPlaying = speakingMessageId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col w-full ${
                          m.sender === 'student' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`p-4 border-2 border-[#0F172A] transition-all rounded-xs ${
                            isCurrentlyPlaying
                              ? 'border-indigo-600 bg-[#F5F3FF] shadow-[4px_4px_0px_#4338CA] max-w-2xl w-full'
                              : m.sender === 'student'
                              ? 'bg-[#0F172A] text-white shadow-[3px_3px_0px_#0F172A] max-w-lg w-auto ml-auto'
                              : 'bg-white text-[#0F172A] shadow-[3px_3px_0px_#0F172A] max-w-2xl w-full'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-4 mb-2 border-b pb-1.5 text-xs font-mono font-bold uppercase tracking-wider ${
                              m.sender === 'student'
                                ? 'border-slate-700 text-slate-300'
                                : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  m.sender === 'student' ? 'bg-emerald-400' : 'bg-indigo-500'
                                }`}
                              />
                              <span>{m.sender === 'student' ? 'YOU (SCHOLAR)' : 'NOVA MENTOR'}</span>
                              {isCurrentlyPlaying && (
                                <span className="px-1.5 py-0.2 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A] text-[9px] font-extrabold animate-pulse">
                                  SPEAKING NOW
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {m.sender === 'nova' && (
                                <button
                                  onClick={() => {
                                    if (isCurrentlyPlaying) {
                                      interruptNova();
                                    } else {
                                      speakText(m.text, m.id, true);
                                    }
                                  }}
                                  className="p-1 hover:bg-slate-200 border border-[#0F172A] bg-white text-[#0F172A] transition-colors"
                                  title={isCurrentlyPlaying ? 'Stop playback' : 'Replay speech'}
                                >
                                  {isCurrentlyPlaying ? (
                                    <Square className="w-3 h-3 fill-current" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                              <span className="text-[11px] font-semibold opacity-75">{m.timestamp}</span>
                            </div>
                          </div>

                          <div
                            className={`whitespace-pre-wrap font-sans text-[15px] sm:text-base leading-relaxed ${
                              m.sender === 'student' ? 'text-white' : 'text-[#0F172A]'
                            }`}
                          >
                            {m.text}
                          </div>

                          {/* Textbook Grounding Source Badge */}
                          {m.sourceBadge && (
                            <div className="mt-3 pt-2 border-t border-slate-200">
                              <SourceBadge
                                bookTitle={m.sourceBadge.bookTitle}
                                pageNumber={m.sourceBadge.pageNumber}
                                lessonTitle={m.sourceBadge.lessonTitle}
                              />
                            </div>
                          )}
                        </div>

                        {/* Socratic Follow-up Prompts */}
                        {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 max-w-2xl">
                            {m.suggestedFollowUps.map((prompt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(prompt)}
                                className="text-xs font-bold px-3 py-1 bg-white border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-[#FDE68A] text-[#0F172A] transition-all text-left active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{prompt}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* LIVE INTERIM TRANSCRIPT BADGE */}
                  {interimTranscript && (
                    <div className="flex items-start gap-2.5 p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] max-w-md animate-fade-in">
                      <Mic className="w-4 h-4 text-emerald-600 animate-pulse shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800">
                            LISTENING IN REAL-TIME...
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <p className="font-sans text-sm text-[#0F172A] italic font-semibold">
                          "{interimTranscript}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* THINKING INDICATOR */}
                  {loading && (
                    <div className="flex items-center gap-2.5 p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] max-w-xs">
                      <Brain className="w-4 h-4 text-[#0F172A] animate-spin" />
                      <span className="text-xs font-extrabold text-[#0F172A]">
                        NOVA is analyzing concepts...
                      </span>
                    </div>
                  )}

                  {/* TEACH-BACK EVALUATION REPORT */}
                  {teachBackResult && (
                    <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-600" />
                          <span className="font-extrabold text-sm text-[#0F172A] uppercase">
                            Concept Mastery Evaluation
                          </span>
                        </div>
                        <span className="text-xs font-extrabold px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A] uppercase">
                          STATUS: {teachBackResult.mastery_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                        <div className="bg-white p-2 border border-[#0F172A]">
                          <div className="flex justify-between font-bold mb-1">
                            <span>FACTUAL RECALL:</span>
                            <span className="font-extrabold text-blue-700">{teachBackResult.recall_score}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${teachBackResult.recall_score}%` }} />
                          </div>
                        </div>

                        <div className="bg-white p-2 border border-[#0F172A]">
                          <div className="flex justify-between font-bold mb-1">
                            <span>UNDERSTANDING:</span>
                            <span className="font-extrabold text-emerald-700">
                              {teachBackResult.understanding_score}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${teachBackResult.understanding_score}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-white p-2 border border-[#0F172A]">
                          <div className="flex justify-between font-bold mb-1">
                            <span>IN OWN WORDS:</span>
                            <span className="font-extrabold text-purple-700">
                              {teachBackResult.in_own_words_score}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                            <div
                              className="bg-purple-500 h-full"
                              style={{ width: `${teachBackResult.in_own_words_score}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-white p-2 border border-[#0F172A]">
                          <div className="flex justify-between font-bold mb-1">
                            <span>REASONING:</span>
                            <span className="font-extrabold text-amber-700">
                              {teachBackResult.cause_effect_score}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                            <div
                              className="bg-amber-500 h-full"
                              style={{ width: `${teachBackResult.cause_effect_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {teachBackResult.badge_earned && (
                        <div className="bg-[#A7F3D0] border-2 border-[#0F172A] p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-700 shrink-0" />
                            <div>
                              <span className="text-xs font-extrabold text-[#0F172A] block">
                                BADGE UNLOCKED: {teachBackResult.badge_earned.badge_name}
                              </span>
                              <p className="text-xs text-slate-700">
                                {teachBackResult.badge_earned.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="lavender">VERIFIED</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* VOICE INTERACTION STATE BANNER (SLIM) */}
              <div className="px-3 py-1.5 border-t-2 border-[#0F172A] bg-[#F1F5F9] flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  {voiceState === 'listening' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-extrabold text-emerald-800">NOVA IS LISTENING...</span>
                    </>
                  ) : voiceState === 'thinking' ? (
                    <>
                      <Brain className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span className="font-extrabold text-amber-800">NOVA IS THINKING...</span>
                    </>
                  ) : voiceState === 'speaking' ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-700 animate-pulse" />
                      <span className="font-extrabold text-indigo-900">NOVA IS SPEAKING...</span>
                    </>
                  ) : voiceState === 'error' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span className="font-extrabold text-rose-800">
                        {voiceErrorNotice || 'MIC NOTICE'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="font-bold text-slate-600">
                        {channelMode === 'live'
                          ? 'Live Voice Ready'
                          : channelMode === 'voice'
                          ? 'Tap mic to speak'
                          : 'Type or click mic to speak'}
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Actions in Status Bar */}
                <div className="flex items-center gap-2">
                  {voiceState === 'speaking' && (
                    <button
                      onClick={interruptNova}
                      className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#FED7AA] border border-[#0F172A] hover:bg-rose-200"
                    >
                      INTERRUPT
                    </button>
                  )}
                  {voiceState === 'listening' && channelMode !== 'live' && (
                    <button
                      onClick={stopListeningSafely}
                      className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 border border-[#0F172A]"
                    >
                      DONE SPEAKING
                    </button>
                  )}
                </div>
              </div>

              {/* BOTTOM MESSAGE COMPOSER (ALWAYS PINNED) */}
              <div className="p-3 bg-white border-t-2 border-[#0F172A] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={loading}
                  placeholder={
                    channelMode === 'live'
                      ? `Live voice active — speak naturally or type here...`
                      : mode === 'teach_back'
                      ? `Explain ${selectedTopic} in your own words...`
                      : `Ask NOVA about ${selectedTopic}...`
                  }
                  className="flex-1 text-sm font-semibold p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] placeholder:text-slate-400 focus:outline-hidden"
                />

                {/* Microphone Voice Button */}
                <button
                  onClick={() => {
                    if (voiceState === 'listening') {
                      stopListeningSafely();
                    } else {
                      if (isSpeaking) interruptNova();
                      startListeningSafely();
                    }
                  }}
                  className={`p-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] shrink-0 ${
                    voiceState === 'listening'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white text-[#0F172A] hover:bg-[#FDE68A]'
                  }`}
                  title={
                    voiceState === 'listening'
                      ? 'Listening... click to pause'
                      : 'Click to speak to NOVA'
                  }
                >
                  {voiceState === 'listening' ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Send / Evaluate Button */}
                <BrutalButton
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  variant="primary"
                  className="py-2.5 px-4 text-xs font-extrabold shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {mode === 'teach_back' ? 'EVALUATE' : 'SEND'}
                  </span>
                </BrutalButton>
              </div>
            </div>

            {/* RIGHT MAIN COMPANION DOCK (POSITIONED RIGHT HERE AS REQUESTED) */}
            <div className="hidden lg:flex w-72 xl:w-80 border-l-2 border-[#0F172A] bg-[#0F172A] flex-col shrink-0 h-full overflow-y-auto p-3">
              <NovaRobotCompanion
                expression={currentExpression}
                voiceState={voiceState}
                isSpeaking={isSpeaking}
                isThinking={loading}
                cameraActive={cameraActive}
                onToggleCamera={toggleCamera}
                cameraAnalysis={cameraAnalysis}
                videoRef={videoRef}
                onReactionHelpClick={(prompt) => handleSendMessage(prompt)}
                isCompact={!isCompanionExpanded}
                onToggleCompact={() => setIsCompanionExpanded((prev) => !prev)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE COMPANION MODAL / POPUP (< 1024px) */}
      {showMobileCompanion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 lg:hidden">
          <div className="relative w-full max-w-sm bg-[#0F172A] border-4 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] rounded-lg p-2 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMobileCompanion(false)}
              className="absolute top-3 right-3 z-30 p-1 bg-white text-[#0F172A] border-2 border-[#0F172A] font-black hover:bg-rose-200"
              title="Close Companion HUD"
            >
              <X className="w-4 h-4" />
            </button>
            <NovaRobotCompanion
              expression={currentExpression}
              voiceState={voiceState}
              isSpeaking={isSpeaking}
              isThinking={loading}
              cameraActive={cameraActive}
              onToggleCamera={toggleCamera}
              cameraAnalysis={cameraAnalysis}
              videoRef={videoRef}
              onReactionHelpClick={(prompt) => {
                handleSendMessage(prompt);
                setShowMobileCompanion(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ==========================================
          MOBILE SLIDE-OVER DRAWER (< 1024px)
         ========================================== */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full border-r-4 border-[#0F172A] p-3 overflow-y-auto space-y-3 shadow-[6px_0px_0px_#0F172A] z-10">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1.5">
              {/* Dual Tabs for Mobile */}
              <div className="flex items-center border border-[#0F172A] bg-white p-0.5">
                <button
                  onClick={() => setLeftPanelTab('hub')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    leftPanelTab === 'hub'
                      ? 'bg-[#0F172A] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>HUB</span>
                </button>
                <button
                  onClick={() => setLeftPanelTab('history')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    leftPanelTab === 'history'
                      ? 'bg-[#FDE68A] text-[#0F172A]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>CHATS ({sessions.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleCreateNewChat();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="p-1 bg-[#A7F3D0] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[#0F172A]"
                  title="New Chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 bg-[#FED7AA] border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[#0F172A] font-extrabold text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {leftPanelTab === 'hub' ? renderLearningHubControls() : renderChatHistory()}
          </div>
        </div>
      )}

      {/* ==========================================
          SHARE CHAT TRANSCRIPT MODAL
         ========================================== */}
      {sharingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-3 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] p-4 space-y-3 font-mono">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#0F172A]" />
                <h3 className="font-extrabold text-sm text-[#0F172A] uppercase">
                  SHARE CHAT TRANSCRIPT
                </h3>
              </div>
              <button
                onClick={() => setSharingSession(null)}
                className="p-1 border border-[#0F172A] bg-white hover:bg-[#FED7AA] text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Info */}
            <div className="p-2.5 bg-[#FEFCE8] border-2 border-[#0F172A] space-y-1">
              <p className="font-extrabold text-xs text-[#0F172A] line-clamp-1">
                {sharingSession.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <span>{sharingSession.subject_name}</span>
                <span>•</span>
                <span>{sharingSession.messages.length} messages</span>
                <span>•</span>
                <span>{new Date(sharingSession.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => copyTranscript(sharingSession)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#A7F3D0] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-extrabold text-xs text-[#0F172A] hover:bg-[#6EE7B7] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>COPY TRANSCRIPT TO CLIPBOARD</span>
              </button>

              <button
                onClick={() => downloadTranscript(sharingSession)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#C4B5FD] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-extrabold text-xs text-[#0F172A] hover:bg-[#A78BFA] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD FILE (.MD)</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => nativeShare(sharingSession)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-extrabold text-xs text-[#0F172A] hover:bg-[#FCD34D] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>SHARE VIA DEVICE APPS</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSharingSession(null)}
                className="px-3 py-1 bg-white border border-[#0F172A] text-xs font-extrabold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0F172A] text-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#FDE68A] px-3.5 py-2 font-mono text-xs font-extrabold animate-bounce">
          <Check className="w-4 h-4 text-[#A7F3D0]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AiTeacher;
