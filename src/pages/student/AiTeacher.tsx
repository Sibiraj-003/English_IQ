import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { SourceBadge } from '../../components/SourceBadge';
import { NovaAvatar, NovaVoiceState } from '../../components/NovaAvatar';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  NovaChatMessage,
  NovaAvatarExpression,
  Subject,
  TeachBackEvaluationResult,
  CameraAnalysisResult,
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

  // Text-To-Speech function
  const speakText = useCallback(
    (text: string, messageId?: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      if (!audioEnabled && channelModeRef.current === 'text') return;

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraActive(false);
      setCameraNotice('Camera disabled. NOVA continues normally via text and audio.');
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
      }
      setCameraActive(true);
      setCameraNotice('Optional presence monitor active. Snapshots only; never recorded.');
      setTimeout(() => captureAndAnalyzeFrame(), 1500);
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraNotice('Camera optional. NOVA operates 100% through text & real-time voice.');
      setCameraActive(false);
    }
  };

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !cameraActive) return;
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
    } catch (err) {
      console.warn('Frame capture notice:', err);
    }
  };

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
  // 6. MESSAGES & CHAT ENGINE
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
        speakText(cleanFeedback, novaMsgId);
      } catch (err: any) {
        console.error(err);
        setCurrentExpression('concerned');
        setVoiceState('error');
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            sender: 'nova',
            text: 'I had trouble evaluating your explanation just now. Please try again or rephrase in your own words.',
            expression: 'concerned',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
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
      speakText(cleanAnswer, novaMsgId);
    } catch (err: any) {
      console.error(err);
      setCurrentExpression('concerned');
      setVoiceState('error');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'nova',
          text: `I couldn't retrieve that information in the available curriculum context. You can rephrase or ask your teacher for guidance.`,
          expression: 'concerned',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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
  // 9. LEARNING HUB CONTROLS CONTENT (SHARED)
  // ==========================================
  const renderLearningHubControls = () => (
    <div className="space-y-4">
      {/* Subject Selector */}
      <BrutalCard className="p-3 bg-white space-y-2.5">
        <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1.5">
          <span className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#0F172A]" /> Curriculum Subject
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
              className={`w-full text-left px-2.5 py-1.5 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
                selectedSubjectId === sub.id
                  ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                  : 'bg-white text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{sub.name}</span>
              <span className="text-[10px] opacity-80 shrink-0 ml-1">{sub.code || 'SUB'}</span>
            </button>
          ))}
        </div>

        {/* Topic Input */}
        <div className="pt-2 border-t border-slate-200">
          <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
            Active Learning Topic:
          </label>
          <input
            type="text"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full text-xs font-bold p-1.5 bg-[#F8FAFC] border-2 border-[#0F172A] focus:outline-hidden"
            placeholder="e.g. Photosynthesis"
          />
        </div>
      </BrutalCard>

      {/* Learning Mode Switcher */}
      <BrutalCard className="p-3 bg-white space-y-2">
        <span className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1.5 border-b-2 border-[#0F172A] pb-1.5">
          <Layers className="w-4 h-4" /> Interaction Mode
        </span>

        <div className="grid grid-cols-1 gap-1.5">
          <button
            onClick={() => setMode('chat')}
            className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'chat'
                ? 'bg-[#C4B5FD] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Socratic Discussion</span>
            <span className="text-[9px] font-extrabold px-1 bg-white border border-[#0F172A]">INQUIRY</span>
          </button>

          <button
            onClick={() => setMode('teach_back')}
            className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'teach_back'
                ? 'bg-[#FDE68A] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Explain it to NOVA</span>
            <span className="text-[9px] font-extrabold px-1 bg-[#A7F3D0] border border-[#0F172A]">MASTERY</span>
          </button>

          <button
            onClick={() => setMode('practice')}
            className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'practice'
                ? 'bg-[#BAE6FD] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Targeted Practice</span>
          </button>

          <button
            onClick={() => setMode('quiz')}
            className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'quiz'
                ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>Quick Concept Quiz</span>
          </button>

          <button
            onClick={() => setMode('revision')}
            className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
              mode === 'revision'
                ? 'bg-[#FED7AA] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span>3-Bullet Revision</span>
          </button>
        </div>
      </BrutalCard>

      {/* Privacy-Preserving Opt-In Camera Monitor Widget */}
      <BrutalCard className="p-3 bg-white space-y-2">
        <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-1.5">
          <span className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Camera (Optional)
          </span>
          <button
            onClick={toggleCamera}
            className={`p-1 border-2 border-[#0F172A] text-xs font-extrabold shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] ${
              cameraActive ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-slate-100 text-slate-700'
            }`}
            title="Toggle optional presence camera"
          >
            {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {cameraActive ? (
          <div className="space-y-2">
            <div className="relative border-2 border-[#0F172A] bg-black rounded-xs overflow-hidden h-28 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-extrabold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
              </div>
            </div>

            <div className="text-[10px] space-y-1 bg-[#F8FAFC] p-2 border border-[#0F172A]">
              <div className="flex justify-between font-bold">
                <span>Face Presence:</span>
                <span
                  className={
                    cameraAnalysis?.face_detected ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }
                >
                  {cameraAnalysis?.face_detected ? 'DETECTED' : 'MONITORING'}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Gaze Signal:</span>
                <span className="font-extrabold uppercase">{cameraAnalysis?.gaze_direction || 'CENTER'}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            Camera is optional. NOVA learns with you equally well through text and audio.
          </p>
        )}

        {cameraNotice && (
          <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 border border-slate-300">
            {cameraNotice}
          </p>
        )}
      </BrutalCard>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 max-w-6xl mx-auto w-full font-mono select-none">
      {/* ==========================================
          TOP STATUS & MODE BAR
         ========================================== */}
      <div className="bg-[#FEFCE8] border-2 border-[#0F172A] p-2.5 sm:p-3 shadow-[3px_3px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <Brain className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-[#0F172A] tracking-tight">
                NOVA AI COMPANION
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
                REAL-TIME VOICE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600">
              Cloud AI Orchestration • Zero GPU Requirement • Textbook Grounded
            </p>
          </div>
        </div>

        {/* Top Controls: Channel Switcher (TEXT | VOICE | LIVE) + Timer */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Interaction Channel Switcher */}
          <div className="flex items-center border-2 border-[#0F172A] bg-white shadow-[2px_2px_0px_#0F172A] p-0.5">
            <button
              onClick={() => handleSelectChannel('text')}
              className={`px-2 py-1 text-xs font-extrabold transition-all ${
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
              className={`px-2 py-1 text-xs font-extrabold transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 text-xs font-extrabold transition-all flex items-center gap-1.5 ${
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
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-xs font-extrabold active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Menu className="w-4 h-4 text-[#0F172A]" />
            <span>LEARNING HUB</span>
          </button>

          {/* Active Study Timer */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <Clock className="w-3.5 h-3.5 text-[#0F172A] animate-pulse" />
            <span className="text-[11px] font-extrabold text-[#0F172A]">
              {Math.floor(studySeconds / 60)}m {studySeconds % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          MAIN WORKSPACE (RESIZABLE DESKTOP LAYOUT)
         ========================================== */}
      <div
        ref={mainContainerRef}
        className="relative flex flex-col lg:flex-row w-full min-h-[720px] bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden"
      >
        {/* DESKTOP LEFT LEARNING PANEL */}
        {!isPanelCollapsed && (
          <div
            style={{ width: `${panelWidth}px` }}
            className="hidden lg:flex flex-col bg-[#F8FAFC] border-r-2 border-[#0F172A] overflow-y-auto p-3.5 shrink-0 transition-[width] duration-75 select-text"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2 mb-3">
              <span className="text-xs font-extrabold uppercase text-[#0F172A] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> LEARNING HUB
              </span>
              <button
                onClick={togglePanelCollapse}
                className="p-1 bg-white border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-[#FDE68A] active:scale-95 text-[#0F172A]"
                title="Collapse Learning Panel"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderLearningHubControls()}
          </div>
        )}

        {/* TACTILE VERTICAL DRAG DIVIDER (DESKTOP) */}
        {!isPanelCollapsed ? (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`hidden lg:flex flex-col items-center justify-between py-6 w-3 border-r-2 border-[#0F172A] cursor-col-resize select-none shrink-0 transition-colors ${
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
          <div className="hidden lg:flex flex-col items-center py-4 px-1 bg-[#FEFCE8] border-r-2 border-[#0F172A] shrink-0">
            <button
              onClick={togglePanelCollapse}
              className="p-1 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-[#FDE68A] text-[#0F172A] mb-4 active:scale-95"
              title="Expand Learning Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-extrabold uppercase text-[#0F172A] [writing-mode:vertical-lr] tracking-widest py-2">
              LEARNING HUB
            </span>
          </div>
        )}

        {/* RIGHT MAIN CONVERSATION AREA */}
        <div className="flex-1 min-w-0 flex flex-col h-[720px] bg-white">
          {/* HEADER BAR: NOVA AVATAR & COMPANION IDENTITY */}
          <div className="p-3 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* NOVA AI FACE AVATAR */}
              <NovaAvatar
                expression={currentExpression}
                voiceState={voiceState}
                isSpeaking={isSpeaking}
                isThinking={loading}
                size="md"
                showLabel={true}
              />

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-sm sm:text-base text-[#0F172A] tracking-tight">
                    NOVA // LEARNING COMPANION
                  </h2>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] border border-[#0F172A]">
                    {currentSubject?.name || 'Science'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  Topic: {selectedTopic}
                </p>
              </div>
            </div>

            {/* Header Right: Audio Toggle & Quick Interruption Button */}
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={interruptNova}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-extrabold bg-[#FED7AA] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-rose-200 active:scale-95 text-[#0F172A]"
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
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
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
            <div className="bg-[#FEFCE8] border-b-2 border-[#0F172A] p-2 sm:p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="font-extrabold text-[#0F172A]">"EXPLAIN IT TO NOVA" MODE:</span>
                <span className="text-slate-700 font-bold hidden sm:inline">
                  Explain {selectedTopic} in your own words. NOVA evaluates conceptual understanding!
                </span>
              </div>
              <Badge variant="lavender">TEACH-BACK</Badge>
            </div>
          )}

          {channelMode === 'live' && (
            <div className="bg-[#ECFDF5] border-b-2 border-[#0F172A] px-3 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-emerald-900 text-[11px]">
                  LIVE VOICE ACTIVE:
                </span>
                <span className="text-emerald-800 text-[11px] hidden sm:inline">
                  Speak naturally. Say anything to interrupt or ask a follow-up.
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

          {/* SCROLLABLE CONVERSATION STREAM */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
            {messages.map((m) => {
              const isCurrentlyPlaying = speakingMessageId === m.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'student' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-3.5 border-2 border-[#0F172A] transition-all ${
                      isCurrentlyPlaying
                        ? 'border-indigo-600 bg-[#F5F3FF] shadow-[4px_4px_0px_#4338CA]'
                        : m.sender === 'student'
                        ? 'bg-[#0F172A] text-white shadow-[3px_3px_0px_#0F172A]'
                        : 'bg-white text-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1.5 border-b border-slate-300/40 pb-1 text-[10px] font-bold opacity-80 uppercase">
                      <span className="flex items-center gap-1.5">
                        {m.sender === 'student' ? 'YOU (SCHOLAR)' : 'NOVA MENTOR'}
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
                                speakText(m.text, m.id);
                              }
                            }}
                            className="p-1 hover:bg-slate-200 border border-[#0F172A] bg-white text-[#0F172A] transition-colors"
                            title={isCurrentlyPlaying ? 'Stop playback' : 'Replay speech'}
                          >
                            {isCurrentlyPlaying ? (
                              <Square className="w-2.5 h-2.5 fill-current" />
                            ) : (
                              <Volume2 className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                        <span>{m.timestamp}</span>
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                      {m.text}
                    </div>

                    {/* Textbook Grounding Source Badge */}
                    {m.sourceBadge && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200">
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
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%] sm:max-w-[85%]">
                      {m.suggestedFollowUps.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-[10px] font-bold px-2 py-1 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-[#FDE68A] text-[#0F172A] transition-all text-left active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
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

            {/* LIVE INTERIM TRANSCRIPT BADGE (NEVER DUPLICATED) */}
            {interimTranscript && (
              <div className="flex items-start gap-2.5 p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] max-w-md animate-fade-in">
                <Mic className="w-4 h-4 text-emerald-600 animate-pulse shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800">
                      LISTENING IN REAL-TIME...
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#0F172A] italic font-semibold">
                    "{interimTranscript}"
                  </p>
                </div>
              </div>
            )}

            {/* THINKING INDICATOR */}
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] max-w-xs">
                <Brain className="w-4 h-4 text-[#0F172A] animate-spin" />
                <span className="text-xs font-extrabold text-[#0F172A]">
                  NOVA is thinking & analyzing concepts...
                </span>
              </div>
            )}

            {/* TEACH-BACK EVALUATION REPORT */}
            {teachBackResult && (
              <div className="p-3.5 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-xs text-[#0F172A] uppercase">
                      Concept Mastery Evaluation
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A] uppercase">
                    STATUS: {teachBackResult.mastery_level}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
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
                      <span>CONCEPT UNDERSTANDING:</span>
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
                      <span>EXPLAINED IN OWN WORDS:</span>
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
                      <span>CAUSAL REASONING:</span>
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
                        <p className="text-[10px] text-slate-700">
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

          {/* ==========================================
              VOICE INTERACTION STATE BANNER
             ========================================== */}
          <div className="px-3 py-1.5 border-t-2 border-[#0F172A] bg-[#F1F5F9] flex items-center justify-between text-xs">
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
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
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
                  className="text-[10px] font-extrabold px-2 py-0.5 bg-[#FED7AA] border border-[#0F172A] hover:bg-rose-200"
                >
                  INTERRUPT
                </button>
              )}
              {voiceState === 'listening' && channelMode !== 'live' && (
                <button
                  onClick={stopListeningSafely}
                  className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-200 border border-[#0F172A]"
                >
                  DONE SPEAKING
                </button>
              )}
            </div>
          </div>

          {/* ==========================================
              BOTTOM MESSAGE COMPOSER & VOICE BAR
             ========================================== */}
          <div className="p-3 bg-white border-t-2 border-[#0F172A] flex flex-col gap-2">
            <div className="flex items-center gap-2">
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
                className="flex-1 text-xs font-bold p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] placeholder:text-slate-400 focus:outline-hidden"
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
                className={`p-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
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
                className="py-2.5 px-4 text-xs font-extrabold"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {mode === 'teach_back' ? 'EVALUATE' : 'SEND'}
                </span>
              </BrutalButton>
            </div>
          </div>
        </div>
      </div>

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
          <div className="relative w-80 max-w-[85vw] bg-white h-full border-r-4 border-[#0F172A] p-4 overflow-y-auto space-y-4 shadow-[6px_0px_0px_#0F172A] z-10">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <span className="font-extrabold text-xs uppercase flex items-center gap-2 text-[#0F172A]">
                <BookOpen className="w-4 h-4" /> LEARNING HUB
              </span>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 bg-[#FED7AA] border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A] text-[#0F172A] font-extrabold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderLearningHubControls()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiTeacher;
