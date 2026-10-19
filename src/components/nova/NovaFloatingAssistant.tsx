import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Move,
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
  Radio,
  ExternalLink,
  Pause,
  Play,
  Zap,
} from 'lucide-react';
import { Nova3DAvatar } from './Nova3DAvatar';
import { Nova3DState } from './novaAnimations';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Nova3DAvatar.css';

// Classic DVD Screensaver palette cycling on wall collisions
const DVD_ACCENT_COLORS = [
  '#FDE68A', // Amber yellow
  '#A7F3D0', // Mint emerald
  '#C4B5FD', // Soft purple
  '#FBCFE8', // Rose pink
  '#BAE6FD', // Sky blue
  '#FED7AA', // Peach orange
  '#FCA5A5', // Coral red
];

export const NovaFloatingAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already in the dedicated full AI Teacher classroom, hide to prevent dual 3D canvas contention
  const isDedicatedTeacherRoom = location.pathname.includes('/student/ai-teacher');

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [bounceCount, setBounceCount] = useState<number>(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [isSquashing, setIsSquashing] = useState<boolean>(false);
  const [cornerHitCelebration, setCornerHitCelebration] = useState<boolean>(false);

  // Floating coordinates & physics references (Direct GPU manipulation for 60fps butter-smooth flight)
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(40, Math.floor(Math.random() * (window.innerWidth - 200))) : 120,
    y: typeof window !== 'undefined' ? Math.max(40, Math.floor(Math.random() * (window.innerHeight - 200))) : 140,
  });

  // Freestyle Velocity (cruising speed in pixels/sec)
  const velRef = useRef<{ vx: number; vy: number }>({
    vx: (Math.random() > 0.5 ? 1 : -1) * (95 + Math.random() * 30),
    vy: (Math.random() > 0.5 ? 1 : -1) * (85 + Math.random() * 30),
  });

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);
  const lastBounceTimeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Drag & Throw state
  const isDraggingRef = useRef<boolean>(false);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });
  const dragHistoryRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const hasMovedRef = useRef<boolean>(false);

  // AI Assistant Conversation State
  const [avatarState, setAvatarState] = useState<Nova3DState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string | null>(
    `Hello ${user?.full_name?.split(' ')[0] || 'Friend'}! I'm Nova, floating freely across the website like the DVD logo! Click me anytime to ask questions, solve homework, or explore!`
  );
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  // Floating speech bubble tips
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const speechBubbleTimerRef = useRef<any>(null);

  // Voice speech recognition
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Active accent color
  const currentColor = DVD_ACCENT_COLORS[activeColorIdx % DVD_ACCENT_COLORS.length];

  // =========================================================================
  // CONTINUOUS 60FPS DVD SCREENSAVER FREESTYLE FLOATING ENGINE
  // =========================================================================
  useEffect(() => {
    if (isDedicatedTeacherRoom) return;

    let disposed = false;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (disposed) return;
      animFrameRef.current = requestAnimationFrame(loop);

      const dt = Math.min(0.04, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const container = containerRef.current;
      if (!container) return;

      // When open in console mode, Nova docks into place
      if (isOpen) {
        // Clamp to viewport for console
        const consoleW = Math.min(380, window.innerWidth - 24);
        const consoleH = 500;
        posRef.current.x = Math.max(12, Math.min(posRef.current.x, window.innerWidth - consoleW - 12));
        posRef.current.y = Math.max(12, Math.min(posRef.current.y, window.innerHeight - consoleH - 12));
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`;
        return;
      }

      // If dragging, pointer events directly control posRef
      if (isDraggingRef.current) {
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.08)`;
        return;
      }

      const widgetW = 92;
      const widgetH = 92;
      const minX = 8;
      const maxX = Math.max(12, window.innerWidth - widgetW - 8);
      const minY = 8;
      const maxY = Math.max(12, window.innerHeight - widgetH - 8);

      // Hover brake: smoothly decelerate to gentle hover while student hovers mouse over Nova
      if (isHovered || isPaused) {
        velRef.current.vx *= 0.92;
        velRef.current.vy *= 0.92;
        const hoverBob = Math.sin(now * 0.003) * 4;
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y + hoverBob}px, 0px)`;
        return;
      }

      // Freestyle Aerodynamic Physics: subtle organic steering drift
      const targetSpeed = 115; // cruising speed in px/s
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);

      // Gradually restore velocity toward cruising speed if thrown or slowed down
      if (currentSpeed < 40) {
        velRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
        velRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
      } else {
        const speedFactor = targetSpeed / currentSpeed;
        velRef.current.vx = THREE_lerp(velRef.current.vx, velRef.current.vx * speedFactor, 0.02);
        velRef.current.vy = THREE_lerp(velRef.current.vy, velRef.current.vy * speedFactor, 0.02);
      }

      // Gentle organic freestyle sine drift (wobbles naturally like a flying drone)
      const drift = Math.sin(now * 0.0014) * 16 * dt;
      velRef.current.vx += -velRef.current.vy * 0.07 * dt + drift;
      velRef.current.vy += velRef.current.vx * 0.07 * dt;

      // Update position
      let nx = posRef.current.x + velRef.current.vx * dt;
      let ny = posRef.current.y + velRef.current.vy * dt;

      let bouncedX = false;
      let bouncedY = false;

      // Bounce on Horizontal screen edges (DVD style)
      if (nx >= maxX) {
        nx = maxX;
        velRef.current.vx = -Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 35; // freestyle angle deflection
        bouncedX = true;
      } else if (nx <= minX) {
        nx = minX;
        velRef.current.vx = Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 35;
        bouncedX = true;
      }

      // Bounce on Vertical screen edges (DVD style)
      if (ny >= maxY) {
        ny = maxY;
        velRef.current.vy = -Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 35;
        bouncedY = true;
      } else if (ny <= minY) {
        ny = minY;
        velRef.current.vy = Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 35;
        bouncedY = true;
      }

      posRef.current.x = nx;
      posRef.current.y = ny;

      // Handle Bounce Reaction (DVD Color Shift & Squash)
      if (bouncedX || bouncedY) {
        const hitTime = now;
        if (bouncedX) lastBounceTimeRef.current.x = hitTime;
        if (bouncedY) lastBounceTimeRef.current.y = hitTime;

        // Check if rare Corner Hit happened! (Both axes bounced within 80ms)
        if (Math.abs(lastBounceTimeRef.current.x - lastBounceTimeRef.current.y) < 80) {
          setCornerHitCelebration(true);
          setAvatarState('excited');
          setSpeechBubbleText('🎉 DVD CORNER HIT! PERFECT BOUNCE!');
          setTimeout(() => setCornerHitCelebration(false), 3500);
          setTimeout(() => setSpeechBubbleText(null), 4500);
        }

        // Cycle DVD Color
        setActiveColorIdx((prev) => prev + 1);
        setBounceCount((prev) => prev + 1);

        // Trigger brief squash & stretch
        setIsSquashing(true);
        setTimeout(() => setIsSquashing(false), 320);
      }

      // Organic aerodynamic banking tilt & hover bobbing
      const tiltDeg = (velRef.current.vx / targetSpeed) * 8 + Math.sin(now * 0.0035) * 3.5;
      const hoverBob = Math.sin(now * 0.004) * 3;

      container.style.transform = `translate3d(${nx}px, ${ny + hoverBob}px, 0px) rotate(${tiltDeg}deg)`;
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDedicatedTeacherRoom, isOpen, isHovered, isPaused]);

  // Periodic Floating Speech Bubble Tips
  useEffect(() => {
    const tips = [
      `I'm bouncing around ${getPageTitle(location.pathname)}! Catch me for help!`,
      'Bouncing all over your screen like a DVD player! 🛸',
      'Click me to pause, chat, or take a quick quiz!',
      'You can grab and flick me across your screen!',
      'Need an answer? Click to open my flying console!',
    ];

    speechBubbleTimerRef.current = setInterval(() => {
      if (!isOpen && !isDraggingActive && !speechBubbleText) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setSpeechBubbleText(randomTip);
        setTimeout(() => setSpeechBubbleText(null), 5500);
      }
    }, 24000);

    const initialTipTimer = setTimeout(() => {
      if (!isOpen) {
        setSpeechBubbleText(`Hi ${user?.full_name?.split(' ')[0] || 'there'}! I'm floating all over the site. Catch me anytime!`);
        setTimeout(() => setSpeechBubbleText(null), 6000);
      }
    }, 2500);

    return () => {
      clearInterval(speechBubbleTimerRef.current);
      clearTimeout(initialTipTimer);
    };
  }, [location.pathname, isOpen, isDraggingActive, user?.full_name, speechBubbleText]);

  // TTS Speech Helper
  const speakText = useCallback(
    (text: string) => {
      if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

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

  // Interactive Drag & Throw (Flick Physics)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    dragHistoryRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingActive(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedRef.current = true;
    }

    const widgetW = isOpen ? 360 : 92;
    const widgetH = isOpen ? 520 : 92;

    posRef.current.x = Math.min(
      Math.max(8, dragStartRef.current.posX + dx),
      window.innerWidth - widgetW - 8
    );
    posRef.current.y = Math.min(
      Math.max(8, dragStartRef.current.posY + dy),
      window.innerHeight - widgetH - 8
    );

    // Track historical velocities for throw physics
    const now = performance.now();
    dragHistoryRef.current.push({ x: e.clientX, y: e.clientY, t: now });
    if (dragHistoryRef.current.length > 5) {
      dragHistoryRef.current.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingActive(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Calculate throw release velocity if user flicked Nova!
    if (dragHistoryRef.current.length >= 2) {
      const first = dragHistoryRef.current[0];
      const last = dragHistoryRef.current[dragHistoryRef.current.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.02 && dt < 0.3) {
        const flickVx = (last.x - first.x) / dt;
        const flickVy = (last.y - first.y) / dt;
        const throwSpeed = Math.hypot(flickVx, flickVy);
        if (throwSpeed > 80) {
          velRef.current.vx = Math.min(350, Math.max(-350, flickVx));
          velRef.current.vy = Math.min(350, Math.max(-350, flickVy));
          setAvatarState('excited');
        }
      }
    }
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
      const fallback = `Here is a helpful tip about ${getPageTitle(location.pathname)}: You can explore interactive quizzes, test your knowledge, and study with me anytime!`;
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

  if (isDedicatedTeacherRoom) {
    return null;
  }

  return (
    <aside
      ref={containerRef}
      aria-label="Nova 3D Floating DVD Assistant"
      className="fixed top-0 left-0 z-50 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`,
      }}
    >
      {/* ========================================================
          1. FREESTYLE DVD BOUNCING POD (FLOATING ACROSS ENTIRE WEBSITE)
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
              onClick={() => {
                setIsOpen(true);
                setSpeechBubbleText(null);
              }}
              className="absolute -top-14 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] px-3 py-1.5 rounded-xl text-[11px] font-black text-[#0F172A] whitespace-nowrap cursor-pointer z-50 animate-bounce flex items-center gap-1.5 hover:bg-[#FDE68A]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-spin" />
              <span>{speechBubbleText}</span>
              <div className="absolute -bottom-2 right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#0F172A]" />
            </div>
          )}

          {/* Floating Pod Main Container */}
          <div className="relative">
            {/* Pulsing Anti-Gravity Ground Thruster Halo */}
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full blur-[3px] pointer-events-none transition-colors duration-300 nova-thruster-halo"
              style={{ backgroundColor: currentColor }}
            />

            {/* Bouncing Robot Capsule (DVD Screensaver Object) */}
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
              className={`w-22 h-22 sm:w-24 sm:h-24 rounded-2xl border-3 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] overflow-hidden cursor-grab active:cursor-grabbing flex flex-col items-center justify-between p-1 transition-all duration-150 ${
                isSquashing ? 'nova-dvd-squash' : ''
              } ${isDraggingActive ? 'scale-110 shadow-[8px_8px_0px_#0F172A]' : ''}`}
              style={{
                backgroundColor: currentColor,
              }}
              title="NOVA 3D DVD Floating Companion • Bouncing across the website • Click to chat • Flick to throw!"
            >
              {/* Top Pod Header: DVD Bounce Indicator & Move Grip */}
              <div className="w-full flex items-center justify-between px-1 pt-0.5 z-20">
                <span className="flex items-center gap-1 text-[7.5px] font-black uppercase text-[#0F172A] bg-white border border-[#0F172A] px-1 py-0.2 rounded-xs shadow-[1px_1px_0px_#0F172A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  DVD #{bounceCount}
                </span>
                <Move className="w-3 h-3 text-slate-800 opacity-60 group-hover:opacity-100" />
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
                <span className="text-[7px] font-black uppercase tracking-wider bg-[#0F172A] text-white px-2 py-0.2 rounded-xs">
                  {cornerHitCelebration ? '★ CORNER HIT! ★' : isPaused ? 'PAUSED' : 'FREESTYLE DVD'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hover Flyout Controls */}
          <div
            className={`absolute -right-2 top-0 translate-x-full flex flex-col gap-1.5 transition-all duration-200 ${
              isHovered && !isDraggingActive ? 'opacity-100 translate-x-3 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Open Chat */}
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 bg-[#FEFCE8] hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-lg text-xs font-black text-[#0F172A] flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              title="Open Quick Console"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Pause / Resume Flying */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((prev) => !prev);
              }}
              className={`p-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-lg text-xs font-black flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                isPaused ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-[#FEFCE8] text-[#0F172A]'
              }`}
              title={isPaused ? 'Resume floating flight' : 'Freeze / pause in place'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Jump to Full AI Teacher */}
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
            2. EXPANDED FLOATING AI CONSOLE (DOCKED COMMAND STATION)
           ======================================================== */
        <div className="w-[340px] sm:w-[380px] max-h-[540px] bg-[#FEFCE8] border-3 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] rounded-2xl flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Drag Grip Bar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="border-b-2 border-[#0F172A] px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-colors duration-300"
            style={{ backgroundColor: currentColor }}
          >
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-[#0F172A] tracking-wider uppercase">
                  3D NOVA // DVD PILOT
                </span>
                <span className="text-[8px] font-black px-1.5 py-0.2 bg-white border border-[#0F172A] uppercase">
                  BOUNCE #{bounceCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

              {/* Minimize Back to DVD Floating Mode */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="p-1 bg-[#FECDD3] hover:bg-rose-300 border border-[#0F172A] text-xs font-bold rounded-xs transition-colors cursor-pointer ml-1"
                title="Resume floating flight"
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
              Free-Style DVD Floating AI
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

// Helper: Linear Interpolation
function THREE_lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

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
