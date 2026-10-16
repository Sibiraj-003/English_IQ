import React, { useState, useRef, useEffect } from 'react';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { SourceBadge } from '../../components/SourceBadge';
import { NovaAvatar } from '../../components/NovaAvatar';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  NovaChatMessage,
  NovaAvatarExpression,
  Subject,
  TeachBackEvaluationResult,
  LearningBadge,
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Layers,
  HelpCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const AiTeacher: React.FC = () => {
  const { user } = useAuth();

  // Subjects & Selection
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-sci');
  const [selectedTopic, setSelectedTopic] = useState<string>('Photosynthesis & Plant Life');

  // Mode: chat, teach_back, practice, quiz, revision
  const [mode, setMode] = useState<'chat' | 'teach_back' | 'practice' | 'quiz' | 'revision'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<NovaAvatarExpression>('greeting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Teach-Back state
  const [teachBackResult, setTeachBackResult] = useState<TeachBackEvaluationResult | null>(null);

  // Voice Recognition (Lightweight Web Speech API on client)
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Optional Camera (Opt-in, Event-based, Privacy-Preserving)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraAnalysis, setCameraAnalysis] = useState<CameraAnalysisResult | null>(null);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Study Session Tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const activeTimerRef = useRef<any>(null);

  // Chat messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<NovaChatMessage[]>([
    {
      id: 'init-1',
      sender: 'nova',
      text: `Hello ${user?.full_name || 'Scholar'}! 🌟 I am NOVA, your AI Learning Companion.\n\nI can help you understand challenging topics, explore concepts step-by-step, or you can try **"Explain it to NOVA"** to test whether you truly understand a concept in your own words!`,
      expression: 'greeting',
      suggestedFollowUps: [
        'How do plants make food in photosynthesis?',
        'Can I explain photosynthesis in my own words?',
        'Give me a real-life practice question on plant biology',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Load available subjects
  useEffect(() => {
    api.getSubjects().then((subList) => {
      setSubjects(subList);
      if (subList.length > 0) {
        setSelectedSubjectId(subList[0].id);
      }
    }).catch(console.error);
  }, []);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';
      recognizer.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognizer.onerror = () => setIsRecording(false);
      recognizer.onend = () => setIsRecording(false);
      recognitionRef.current = recognizer;
    }
  }, []);

  // Study Session Tracker: Start session on mount and ping heartbeat
  useEffect(() => {
    let currentSessId: string | null = null;

    api.startStudySession({
      student_id: user?.id,
      subject_id: selectedSubjectId,
      topic: selectedTopic,
      activity_type: mode === 'teach_back' ? 'teach_back' : 'ai_interaction',
    }).then((res) => {
      setSessionId(res.session_id);
      currentSessId = res.session_id;
    }).catch(console.error);

    // Active heartbeat every 15 seconds
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Toggle Voice Recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your explanation directly.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!audioEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Optional Camera Handler (Event-based frame capture only)
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
      setCameraNotice('Optional camera active. Event-based snapshots only. No continuous streaming to server.');

      // Perform one initial privacy check
      setTimeout(() => captureAndAnalyzeFrame(), 1500);
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraNotice('Camera permission denied or camera unavailable. NOVA works 100% via text & voice.');
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

  // Send Message / Submit Teach-Back
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    // Student Message
    const studentMsg: NovaChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInput('');
    setLoading(true);
    setCurrentExpression('thinking');

    // If Teach-Back mode is active
    if (mode === 'teach_back') {
      try {
        const result = await api.submitTeachBack({
          student_id: user?.id,
          subject_id: selectedSubjectId,
          topic: selectedTopic,
          student_explanation: textToSend,
          input_mode: isRecording ? 'voice' : 'text',
        });

        setTeachBackResult(result);
        const expression: NovaAvatarExpression =
          result.understanding_score >= 80 ? 'celebrating' : 'encouraging';
        setCurrentExpression(expression);

        const novaResponseMsg: NovaChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'nova',
          text: result.feedback,
          expression,
          suggestedFollowUps: result.follow_up_questions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, novaResponseMsg]);
        if (audioEnabled) speakText(result.feedback);
      } catch (err: any) {
        console.error(err);
        setCurrentExpression('concerned');
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
      }
      return;
    }

    // Standard NOVA Chat / Inquiry Mode
    try {
      const historyPayload = messages.slice(-6).map((m) => ({
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

      const aiMsg: NovaChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'nova',
        text: response.answer,
        expression: response.expression,
        sourceBadge: response.sourceBadge,
        suggestedFollowUps: response.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (audioEnabled) speakText(response.answer);
    } catch (err: any) {
      console.error(err);
      setCurrentExpression('concerned');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'nova',
          text: `I couldn't find that information in the available academic content. You can ask your teacher or try another topic.`,
          expression: 'concerned',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full font-mono">
      {/* Top Banner: Hybrid Cloud-First Architecture & Active Study Pill */}
      <div className="bg-[#FEFCE8] border-2 border-[#0F172A] p-3 shadow-[3px_3px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <Brain className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#0F172A]">
                NOVA AI LEARNING COMPANION
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A]">
                CLOUD-FIRST AI
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Zero device GPU required • Powered by Render & Groq Cloud • Textbook Grounded
            </p>
          </div>
        </div>

        {/* Live Active Study Timer */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <Clock className="w-4 h-4 text-[#0F172A] animate-pulse" />
          <span className="text-xs font-bold text-slate-700">ACTIVE STUDY:</span>
          <span className="text-xs font-extrabold text-[#0F172A]">
            {Math.floor(studySeconds / 60)}m {studySeconds % 60}s
          </span>
        </div>
      </div>

      {/* Main Learning Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Control Column: Subject, Topic, Mode & Camera Widget */}
        <div className="lg:col-span-1 space-y-4">
          {/* Subject Selector */}
          <BrutalCard className="p-3.5 bg-white space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-2">
              <span className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Curriculum Subject
              </span>
            </div>

            <div className="space-y-1.5">
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
                  <span>{sub.name}</span>
                  <span className="text-[10px] opacity-80">{sub.code || 'SUB'}</span>
                </button>
              ))}
            </div>

            {/* Topic Input */}
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Active Learning Topic:
              </label>
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full text-xs font-bold p-1.5 bg-[#F8FAFC] border-2 border-[#0F172A]"
                placeholder="e.g. Photosynthesis"
              />
            </div>
          </BrutalCard>

          {/* Learning Mode Switcher */}
          <BrutalCard className="p-3.5 bg-white space-y-2">
            <span className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-1.5 border-b-2 border-[#0F172A] pb-2">
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
                <span>💬 Socratic Discussion</span>
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
                <span>🎓 Explain it to NOVA</span>
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
                <span>⚡ Targeted Practice</span>
              </button>

              <button
                onClick={() => setMode('quiz')}
                className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
                  mode === 'quiz'
                    ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <span>❓ Quick Concept Quiz</span>
              </button>

              <button
                onClick={() => setMode('revision')}
                className={`text-left px-2.5 py-2 text-xs font-bold border-2 border-[#0F172A] transition-all flex items-center justify-between ${
                  mode === 'revision'
                    ? 'bg-[#FED7AA] text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <span>📝 3-Bullet Revision</span>
              </button>
            </div>
          </BrutalCard>

          {/* Privacy-Preserving Opt-In Camera Monitor Widget */}
          <BrutalCard className="p-3.5 bg-white space-y-2">
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
                <div className="relative border-2 border-[#0F172A] bg-black rounded-xs overflow-hidden h-32 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-extrabold flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                  </div>
                </div>

                <div className="text-[10px] space-y-1 bg-[#F8FAFC] p-2 border border-[#0F172A]">
                  <div className="flex justify-between font-bold">
                    <span>Face Presence:</span>
                    <span className={cameraAnalysis?.face_detected ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
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

        {/* Right Main Column: NOVA Avatar, Chat Dialogue, Teach-Back Panel, & Input Controls */}
        <div className="lg:col-span-3 flex flex-col h-[700px] bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
          {/* Header Bar with NOVA Avatar & Expression */}
          <div className="p-3 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NovaAvatar
                expression={currentExpression}
                isSpeaking={isSpeaking}
                isThinking={loading}
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-[#0F172A] tracking-tight">
                    NOVA // ACADEMIC MENTOR
                  </h2>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#FDE68A] border border-[#0F172A]">
                    {currentSubject?.name || 'Science'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Topic: {selectedTopic}
                </p>
              </div>
            </div>

            {/* TTS Audio Toggle */}
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (!next) window.speechSynthesis?.cancel();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                audioEnabled ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-white text-slate-700'
              }`}
              title="Toggle Text-to-Speech audio"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{audioEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
            </button>
          </div>

          {/* Mode Sub-banner if Teach-Back is active */}
          {mode === 'teach_back' && (
            <div className="bg-[#FEFCE8] border-b-2 border-[#0F172A] p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="font-extrabold text-[#0F172A]">
                  "EXPLAIN IT TO NOVA" MODE:
                </span>
                <span className="text-slate-700 font-bold hidden sm:inline">
                  Explain {selectedTopic} in your own words. NOVA evaluates conceptual reasoning, not rote memory!
                </span>
              </div>
              <Badge variant="lavender">TEACH-BACK</Badge>
            </div>
          )}

          {/* Scrollable Conversation Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'student' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] text-xs leading-relaxed ${
                    m.sender === 'student'
                      ? 'bg-[#0F172A] text-white font-mono'
                      : 'bg-white text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 border-b border-slate-300/40 pb-1 text-[10px] font-bold opacity-80 uppercase">
                    <span>{m.sender === 'student' ? 'YOU (SCHOLAR)' : 'NOVA MENTOR'}</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
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
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {m.suggestedFollowUps.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[10px] font-bold px-2 py-1 bg-white border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-[#FDE68A] text-[#0F172A] transition-all text-left"
                      >
                        💡 {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] max-w-xs">
                <Brain className="w-4 h-4 text-[#0F172A] animate-spin" />
                <span className="text-xs font-extrabold text-[#0F172A]">
                  NOVA is analyzing concepts...
                </span>
              </div>
            )}

            {/* Teach-Back Evaluation Card if available */}
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

                {/* Recall vs Conceptual Understanding Comparison Bars */}
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
                      <span className="font-extrabold text-emerald-700">{teachBackResult.understanding_score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${teachBackResult.understanding_score}%` }} />
                    </div>
                  </div>

                  <div className="bg-white p-2 border border-[#0F172A]">
                    <div className="flex justify-between font-bold mb-1">
                      <span>EXPLAINED IN OWN WORDS:</span>
                      <span className="font-extrabold text-purple-700">{teachBackResult.in_own_words_score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${teachBackResult.in_own_words_score}%` }} />
                    </div>
                  </div>

                  <div className="bg-white p-2 border border-[#0F172A]">
                    <div className="flex justify-between font-bold mb-1">
                      <span>CAUSAL REASONING:</span>
                      <span className="font-extrabold text-amber-700">{teachBackResult.cause_effect_score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 border border-[#0F172A] overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${teachBackResult.cause_effect_score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Badge Unlocked Celebration */}
                {teachBackResult.badge_earned && (
                  <div className="bg-[#A7F3D0] border-2 border-[#0F172A] p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
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

          {/* Bottom Chat Input Bar */}
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
                  mode === 'teach_back'
                    ? `Explain ${selectedTopic} in your own words...`
                    : `Ask NOVA about ${selectedTopic}...`
                }
                className="flex-1 text-xs font-bold p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] placeholder:text-slate-400 focus:outline-hidden"
              />

              {/* Microphone Voice Button */}
              <button
                onClick={toggleRecording}
                className={`p-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-[#0F172A]'
                }`}
                title={isRecording ? 'Listening... click to stop' : 'Click to speak your explanation'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <BrutalButton
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                variant="primary"
                className="py-2 px-4 text-xs"
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
    </div>
  );
};

export default AiTeacher;
