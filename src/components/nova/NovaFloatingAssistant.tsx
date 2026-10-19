import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Move,
  Compass,
  Maximize2,
  Minimize2,
  X,
  Send,
  Volume2,
  VolumeX,
  MessageSquare,
  GraduationCap,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Mic,
  MicOff,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Nova3DAvatar } from './Nova3DAvatar';
import { Nova3DState } from './novaAnimations';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Nova3DAvatar.css';

interface Position {
  x: number;
  y: number;
}

const STORAGE_POS_KEY = 'nova_floating_position';
const STORAGE_WANDER_KEY = 'nova_floating_wander_active';

export const NovaFloatingAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already in the dedicated full AI Teacher classroom, hide to prevent dual 3D canvas contention
  const isDedicatedTeacherRoom = location.pathname.includes('/student/ai-teacher');

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isWandering, setIsWandering] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_WANDER_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Floating coordinates in viewport
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Default: bottom-right offset
    const defX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 120) : 1000;
    const defY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 150) : 650;
    return { x: defX, y: defY };
  });

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });
  const hasMovedRef = useRef<boolean>(false);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Floating AI conversation state
  const [avatarState, setAvatarState] = useState<Nova3DState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string | null>(
    `Hello ${user?.full_name?.split(' ')[0] || 'Friend'}! I'm Nova, your 3D AI companion. I'm floating around to help you learn and explore anywhere on this website!`
  );
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  // Floating speech bubble tips
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const speechBubbleTimerRef = useRef<any>(null);

  // Voice speech-to-text recognition
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Patrol / Wander Waypoints
  const wanderStepRef = useRef<number>(0);

  // Ensure position stays within viewport bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      const widgetW = isOpen ? 360 : 100;
      const widgetH = isOpen ? 520 : 100;
      setPosition((prev) => ({
        x: Math.min(Math.max(12, prev.x), Math.max(12, window.innerWidth - widgetW - 12)),
        y: Math.min(Math.max(12, prev.y), Math.max(12, window.innerHeight - widgetH - 12)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Patrol / Wander Mode Loop
  useEffect(() => {
    if (!isWandering || isHovered || isDraggingActive || isOpen) return;

    const patrolWaypoints = [
      () => ({ x: window.innerWidth - 120, y: window.innerHeight - 150 }), // Bottom-Right
      () => ({ x: window.innerWidth - 120, y: 90 }), // Top-Right
      () => ({ x: 80, y: 90 }), // Top-Left
      () => ({ x: 80, y: window.innerHeight - 150 }), // Bottom-Left
    ];

    const patrolInterval = setInterval(() => {
      wanderStepRef.current = (wanderStepRef.current + 1) % patrolWaypoints.length;
      const nextPos = patrolWaypoints[wanderStepRef.current]();
      setPosition(nextPos);
    }, 9000);

    return () => clearInterval(patrolInterval);
  }, [isWandering, isHovered, isDraggingActive, isOpen]);

  // Periodic Contextual Tips
  useEffect(() => {
    const tips = [
      `Need help on ${getPageTitle(location.pathname)}? Ask me!`,
      'Drag me anywhere on your screen!',
      'Click me to spin or ask any curriculum question!',
      'Toggle Patrol Mode to let me float around the site!',
      'Ready to study? Jump into my Full AI Classroom!',
    ];

    speechBubbleTimerRef.current = setInterval(() => {
      if (!isOpen && !isDraggingActive) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setSpeechBubbleText(randomTip);
        setTimeout(() => setSpeechBubbleText(null), 6000);
      }
    }, 28000);

    // Initial greeting after 3 seconds
    const initialTipTimer = setTimeout(() => {
      if (!isOpen) {
        setSpeechBubbleText(`Hi ${user?.full_name?.split(' ')[0] || 'there'}! I'm floating with you. Click me for help!`);
        setTimeout(() => setSpeechBubbleText(null), 5500);
      }
    }, 3000);

    return () => {
      clearInterval(speechBubbleTimerRef.current);
      clearTimeout(initialTipTimer);
    };
  }, [location.pathname, isOpen, isDraggingActive, user?.full_name]);

  // TTS Speech Helper
  const speakText = useCallback(
    (text: string) => {
      if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      // Clean markdown tags for natural speech
      const clean = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.08;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setAvatarState('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setAvatarState('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setAvatarState('idle');
      };

      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled]
  );

  // Stop speech when assistant is minimized or unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListeningVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListeningVoice(false);
      setAvatarState('idle');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = 'en-US';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.onstart = () => {
      setIsListeningVoice(true);
      setAvatarState('listening');
    };

    recognizer.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setInputQuery(transcript);
        handleAskAssistant(transcript);
      }
      setIsListeningVoice(false);
    };

    recognizer.onerror = () => {
      setIsListeningVoice(false);
      setAvatarState('idle');
    };

    recognizer.onend = () => {
      setIsListeningVoice(false);
      if (!isSpeaking) setAvatarState('idle');
    };

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Dragging handlers with PointerCapture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingActive(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
    }

    const widgetW = isOpen ? 360 : 100;
    const widgetH = isOpen ? 520 : 100;

    const newX = Math.min(
      Math.max(12, dragStartRef.current.posX + dx),
      window.innerWidth - widgetW - 12
    );
    const newY = Math.min(
      Math.max(12, dragStartRef.current.posY + dy),
      window.innerHeight - widgetH - 12
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingActive(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Save final position
    try {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(position));
    } catch {}
  };

  // Toggle Wandering Patrol Mode
  const toggleWander = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsWandering((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_WANDER_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Send question to Nova API
  const handleAskAssistant = async (queryOverride?: string) => {
    const textToSend = (queryOverride || inputQuery).trim();
    if (!textToSend || isThinking) return;

    setInputQuery('');
    setIsThinking(true);
    setAvatarState('thinking');

    try {
      const pageContext = getPageTitle(location.pathname);
      const res = await api.askNova({
        student_id: user?.id,
        class_id: user?.class_id,
        section_id: user?.section_id,
        subject_id: 'sub-sci',
        topic: `School Context: ${pageContext}`,
        message: textToSend,
        mode: 'chat',
      });

      const answer = res.answer || "I'm here to help! Ask me anything about your studies or this school platform.";
      setLastResponse(answer);
      setAvatarState('speaking');
      speakText(answer);
    } catch (err) {
      console.warn('Nova floating inquiry fallback:', err);
      // Friendly contextual fallback
      const fallback = `Here is a helpful tip about ${getPageTitle(location.pathname)}: You can interact with all student learning materials, quizzes, and track your progress in real time. Would you like to open the Full AI Classroom?`;
      setLastResponse(fallback);
      setAvatarState('speaking');
      speakText(fallback);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopyResponse = () => {
    if (!lastResponse) return;
    navigator.clipboard.writeText(lastResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // If in dedicated teacher room, suppress floating widget
  if (isDedicatedTeacherRoom) {
    return null;
  }

  return (
    <aside
      aria-label="Nova 3D Floating Assistant"
      className="fixed z-50 pointer-events-none select-none transition-all duration-300 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDraggingActive ? 'none' : isWandering ? 'all 4s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'transform 0.2s ease-out',
      }}
    >
      {/* ========================================================
          1. MINIMIZED FLOATING COMPANION POD (IDLE LEVITATION)
         ======================================================== */}
      {!isOpen ? (
        <div
          className="relative pointer-events-auto group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Contextual Floating Speech Bubble */}
          {speechBubbleText && (
            <div
              onClick={() => setIsOpen(true)}
              className="absolute -top-14 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] px-3 py-1.5 rounded-xl text-[11px] font-black text-[#0F172A] whitespace-nowrap cursor-pointer z-50 animate-bounce flex items-center gap-1.5 hover:bg-[#FDE68A]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-spin" />
              <span>{speechBubbleText}</span>
              {/* Downward triangle arrow */}
              <div className="absolute -bottom-2 right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#0F172A]" />
            </div>
          )}

          {/* Floating Pod Main Container with Anti-Gravity Levitation */}
          <div className="relative">
            {/* Pulsing Anti-Gravity Ground Shadow */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#0F172A]/30 rounded-full blur-[2px] nova-floating-shadow pointer-events-none" />

            {/* Floating Robot Capsule */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={() => {
                if (!hasMovedRef.current) {
                  setIsOpen(true);
                  setSpeechBubbleText(null);
                }
              }}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] bg-gradient-to-b from-[#FEFCE8] via-[#FEFCE8] to-[#FDE68A] overflow-hidden cursor-grab active:cursor-grabbing flex flex-col items-center justify-between p-1 transition-transform ${
                isDraggingActive ? 'scale-105 shadow-[7px_7px_0px_#0F172A]' : 'nova-floating-levitate'
              }`}
              title="NOVA 3D AI Companion • Drag to reposition • Click to open quick console"
            >
              {/* Top Pod Drag Handle & Badge */}
              <div className="w-full flex items-center justify-between px-1.5 pt-0.5 z-20">
                <span className="flex items-center gap-1 text-[8px] font-black uppercase text-[#0F172A] bg-white border border-[#0F172A] px-1 py-0.2 rounded-sm shadow-[1px_1px_0px_#0F172A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  NOVA 3D
                </span>
                <Move className="w-3 h-3 text-slate-700 opacity-60 group-hover:opacity-100" />
              </div>

              {/* Real 3D Robot Canvas Area */}
              <div className="w-full flex-1 relative min-h-0 pointer-events-none">
                <Nova3DAvatar
                  compact={true}
                  state={avatarState}
                  isSpeaking={isSpeaking}
                  isThinking={isThinking}
                  interactive={false}
                  showControls={false}
                  height="100%"
                />
              </div>

              {/* Bottom Status Ribbon */}
              <div className="w-full z-20 flex items-center justify-center pb-0.5">
                <span className="text-[7.5px] font-black uppercase tracking-wider bg-[#0F172A] text-white px-2 py-0.2 rounded-xs">
                  {isWandering ? 'PATROL ACTIVE' : 'FLOATING'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hover Action Pills (Flyout Buttons) */}
          <div
            className={`absolute -right-2 top-0 translate-x-full flex flex-col gap-1.5 transition-all duration-200 ${
              isHovered && !isDraggingActive ? 'opacity-100 translate-x-3 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 bg-[#FEFCE8] hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-lg text-xs font-black text-[#0F172A] flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              title="Open Quick Console"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleWander}
              className={`p-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-lg text-xs font-black flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                isWandering ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-[#FEFCE8] hover:bg-slate-100 text-[#0F172A]'
              }`}
              title={isWandering ? 'Patrol Mode Active (Click to freeze)' : 'Enable Float Around / Patrol Mode'}
            >
              <Compass className={`w-3.5 h-3.5 ${isWandering ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/student/ai-teacher')}
              className="p-1.5 bg-[#C4B5FD] hover:bg-[#A78BFA] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-lg text-xs font-black text-[#0F172A] flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              title="Go to Full AI Classroom"
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
            2. EXPANDED FLOATING AI CONSOLE (INTERACTIVE WORKSPACE)
           ======================================================== */
        <div className="w-[340px] sm:w-[380px] max-h-[540px] bg-[#FEFCE8] border-3 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] rounded-2xl flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Drag Grip Bar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="bg-[#FDE68A] border-b-2 border-[#0F172A] px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-[#0F172A] tracking-wider uppercase">
                  3D NOVA COMPANION
                </span>
                <span className="text-[8px] font-black px-1.5 py-0.2 bg-[#A7F3D0] border border-[#0F172A] uppercase">
                  FLOATING
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Wander Patrol Mode Toggle */}
              <button
                onClick={toggleWander}
                className={`p-1 border border-[#0F172A] text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                  isWandering ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-white hover:bg-slate-100 text-slate-700'
                }`}
                title={isWandering ? 'Patrol active (drifting)' : 'Turn on Float Around mode'}
              >
                <Compass className={`w-3.5 h-3.5 ${isWandering ? 'animate-spin' : ''}`} />
              </button>

              {/* Speech Voice Output Toggle */}
              <button
                onClick={() => {
                  setSpeechEnabled((prev) => !prev);
                  if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`p-1 border border-[#0F172A] text-xs font-bold rounded-xs cursor-pointer ${
                  speechEnabled ? 'bg-white hover:bg-slate-100 text-[#0F172A]' : 'bg-slate-200 text-slate-500'
                }`}
                title={speechEnabled ? 'Voice output enabled' : 'Voice muted'}
              >
                {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Jump to Full AI Teacher */}
              <button
                onClick={() => navigate('/student/ai-teacher')}
                className="p-1 bg-[#C4B5FD] hover:bg-[#A78BFA] border border-[#0F172A] text-xs font-bold rounded-xs transition-colors cursor-pointer"
                title="Open Full AI Teacher Classroom"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#0F172A]" />
              </button>

              {/* Minimize Back to Pod */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="p-1 bg-[#FECDD3] hover:bg-rose-300 border border-[#0F172A] text-xs font-bold rounded-xs transition-colors cursor-pointer ml-1"
                title="Minimize companion"
              >
                <X className="w-3.5 h-3.5 text-[#0F172A]" />
              </button>
            </div>
          </div>

          {/* 3D Robot Live Stage Area */}
          <div className="relative h-36 bg-gradient-to-b from-[#FEFCE8] to-[#FDE68A] border-b-2 border-[#0F172A] overflow-hidden">
            <Nova3DAvatar
              state={avatarState}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              interactive={true}
              showControls={false}
              height="100%"
            />

            {/* Quick Status Pill */}
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="text-[8px] font-black px-1.5 py-0.5 bg-white/90 border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] uppercase flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSpeaking ? 'bg-purple-500 animate-ping' : isThinking ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                {isSpeaking ? 'SPEAKING' : isThinking ? 'THINKING' : 'READY TO HELP'}
              </span>
            </div>

            {/* Interaction Reminder */}
            <div className="absolute bottom-1.5 right-2 pointer-events-none">
              <span className="text-[8px] font-mono font-bold text-slate-700 bg-white/70 px-1 border border-slate-400">
                DRAG 360° • CLICK JUMP
              </span>
            </div>
          </div>

          {/* Assistant Content & Quick Response */}
          <div className="p-2.5 flex-1 overflow-y-auto space-y-2 max-h-[220px]">
            {/* Latest AI Message Bubble */}
            {lastResponse && (
              <div className="p-2.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-xl text-xs font-bold text-[#0F172A] relative group">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 text-[9px] font-black text-slate-600 uppercase">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3 text-[#0F172A]" /> NOVA AI
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyResponse}
                      className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-[#0F172A]"
                      title="Copy response"
                    >
                      {copiedResponse ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {speechEnabled && (
                      <button
                        onClick={() => speakText(lastResponse)}
                        className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-[#0F172A]"
                        title="Read out loud"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-[11px] sm:text-xs">
                  {lastResponse}
                </p>
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <button
                onClick={() => handleAskAssistant(`Can you explain what I am looking at on the ${getPageTitle(location.pathname)} page?`)}
                className="text-[10px] font-extrabold px-2 py-0.8 bg-white hover:bg-[#FDE68A] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] rounded-md transition-colors cursor-pointer flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-amber-600" /> Explain this page
              </button>
              <button
                onClick={() => handleAskAssistant('Give me a quick 1-question practice quiz about science!')}
                className="text-[10px] font-extrabold px-2 py-0.8 bg-white hover:bg-[#A7F3D0] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] rounded-md transition-colors cursor-pointer"
              >
                🎯 Quick Quiz
              </button>
              <button
                onClick={() => handleAskAssistant('Give me an effective 2-minute memory study tip for exams.')}
                className="text-[10px] font-extrabold px-2 py-0.8 bg-white hover:bg-[#C4B5FD] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] rounded-md transition-colors cursor-pointer"
              >
                ⚡ Study Tip
              </button>
            </div>
          </div>

          {/* Bottom Query Input Bar */}
          <div className="p-2 bg-white border-t-2 border-[#0F172A] flex items-center gap-1.5">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskAssistant();
              }}
              placeholder={`Ask Nova anything on ${getPageTitle(location.pathname)}...`}
              disabled={isThinking}
              className="flex-1 bg-[#F8FAFC] border border-[#0F172A] px-2.5 py-1.5 text-xs font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-hidden focus:bg-white"
            />

            {/* Voice Input Button */}
            <button
              onClick={toggleVoiceInput}
              className={`p-1.5 border border-[#0F172A] rounded-xs font-bold transition-all cursor-pointer ${
                isListeningVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-[#0F172A]'
              }`}
              title={isListeningVoice ? 'Listening... click to stop' : 'Speak question'}
            >
              {isListeningVoice ? <Radio className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleAskAssistant()}
              disabled={isThinking || !inputQuery.trim()}
              className="px-2.5 py-1.5 bg-[#A7F3D0] hover:bg-[#6EE7B7] disabled:opacity-40 border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] text-xs font-black text-[#0F172A] flex items-center gap-1 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Full Classroom Launcher Footer */}
          <div className="px-3 py-1 bg-[#FEFCE8] border-t border-slate-200 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500">
              Grounded AI Companion
            </span>
            <button
              onClick={() => navigate('/student/ai-teacher')}
              className="text-[9px] font-black text-[#0F172A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>OPEN FULL CLASSROOM</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

// Friendly page title resolver for contextual assistance
function getPageTitle(pathname: string): string {
  if (pathname.includes('/fees')) return 'Fee Management';
  if (pathname.includes('/attendance')) return 'Attendance Records';
  if (pathname.includes('/timetable')) return 'School Timetable';
  if (pathname.includes('/homework')) return 'Homework & Assignments';
  if (pathname.includes('/exams')) return 'Examinations & Results';
  if (pathname.includes('/classroom')) return 'Classroom Console';
  if (pathname.includes('/teacher')) return 'Teacher Dashboard';
  if (pathname.includes('/admin')) return 'Admin Console';
  if (pathname.includes('/student')) return 'Student Portal';
  return 'SmartSchool';
}
