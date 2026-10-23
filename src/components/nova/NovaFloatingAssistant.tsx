import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Mic, Brain, Volume2 } from 'lucide-react';
import { Nova3DAvatar } from './Nova3DAvatar';
import { Nova3DState } from './novaAnimations';
import { NovaVoiceState } from '../NovaAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { speakWithNovaVoice } from '../../utils/novaVoice';
import './Nova3DAvatar.css';

// Classic DVD Screensaver palette cycling on wall collisions
const DVD_GLOW_COLORS = [
  '#F59E0B', // Amber orange
  '#10B981', // Emerald green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#3B82F6', // Blue
];

export const NovaFloatingAssistant: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAiTeacherRoute = location.pathname.includes('/ai-teacher');

  const [isPanelHidden, setIsPanelHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nova_companion_panel_hidden') === 'true';
    } catch {
      return false;
    }
  });

  // Listen for panel hide/show events from AiTeacher
  useEffect(() => {
    const handlePanelState = (e: any) => {
      if (e?.detail && typeof e.detail.isHidden === 'boolean') {
        setIsPanelHidden(e.detail.isHidden);
      }
    };
    window.addEventListener('nova_companion_panel_state', handlePanelState);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nova_companion_panel_hidden') {
        setIsPanelHidden(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('nova_companion_panel_state', handlePanelState);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Live Speech Recognition & AI Thinking State synchronized with AiTeacher
  const [remoteVoiceState, setRemoteVoiceState] = useState<NovaVoiceState>('idle');
  const [remoteTranscript, setRemoteTranscript] = useState<string>('');
  const [remoteThinking, setRemoteThinking] = useState<boolean>(false);

  useEffect(() => {
    const handleVoiceEvent = (e: any) => {
      if (e?.detail) {
        if (e.detail.voiceState !== undefined) setRemoteVoiceState(e.detail.voiceState);
        if (e.detail.interimTranscript !== undefined) setRemoteTranscript(e.detail.interimTranscript);
        if (e.detail.isThinking !== undefined) setRemoteThinking(e.detail.isThinking);
      }
    };
    window.addEventListener('nova_voice_state', handleVoiceEvent);
    return () => {
      window.removeEventListener('nova_voice_state', handleVoiceEvent);
    };
  }, []);

  const [bounceCount, setBounceCount] = useState<number>(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [isIntro, setIsIntro] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // 3D Avatar state
  const [avatarState, setAvatarState] = useState<Nova3DState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Derive active avatar state from remote voice / thinking activity
  const effectiveAvatarState: Nova3DState =
    remoteVoiceState === 'listening'
      ? 'listening'
      : remoteThinking || remoteVoiceState === 'thinking'
      ? 'thinking'
      : remoteVoiceState === 'speaking' || isSpeaking
      ? 'speaking'
      : avatarState;

  // Continuous 60FPS Direct GPU coordinates & physics references
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerWidth * 0.4)) : 200,
    y: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerHeight * 0.2)) : 150,
  });

  // Freestyle Velocity (50% of original cruising speed in pixels/sec)
  const velRef = useRef<{ vx: number; vy: number }>({
    vx: (Math.random() > 0.5 ? 1 : -1) * (55 + Math.random() * 15),
    vy: (Math.random() > 0.5 ? 1 : -1) * (45 + Math.random() * 15),
  });

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);
  const isHoveredRef = useRef<boolean>(false);

  // Dragging & Throw (Flick Physics)
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });
  const dragHistoryRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const hasMovedRef = useRef<boolean>(false);

  const currentColor = DVD_GLOW_COLORS[activeColorIdx % DVD_GLOW_COLORS.length];

  // Voice Speech: Uses the EXACT same live female voice as NOVA AI Teacher
  const speakGreeting = useCallback((text: string) => {
    speakWithNovaVoice(text, {
      onStart: () => {
        setIsSpeaking(true);
        setAvatarState('speaking');
      },
      onEnd: () => {
        setIsSpeaking(false);
        setAvatarState('idle');
      },
      onError: () => {
        setIsSpeaking(false);
        setAvatarState('idle');
      },
    });
  }, []);

  // Quick intro on first login: introduce 360° rotation and drag once
  useEffect(() => {
    const introKey = user?.id ? `nova_intro_seen_${user.id}` : 'nova_intro_seen_guest';
    let hasSeenIntro = false;
    try {
      hasSeenIntro = localStorage.getItem(introKey) === 'true';
    } catch {
      hasSeenIntro = false;
    }

    if (!hasSeenIntro) {
      try {
        localStorage.setItem(introKey, 'true');
      } catch {}

      const introTimer = setTimeout(() => {
        const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : '';
        const nameGreeting = firstName ? `Hi ${firstName}!` : `Hi!`;
        const introText = `${nameGreeting} I'm Nova! Drag me anywhere and hold right-click to rotate me 360°!`;

        setIsIntro(true);
        setSpeechBubbleText(introText);
        setAvatarState('happy');
        speakGreeting(introText);

        const dismissTimer = setTimeout(() => {
          setSpeechBubbleText((curr) => (curr === introText ? null : curr));
          setIsIntro(false);
          setAvatarState('idle');
        }, 5500);

        return () => clearTimeout(dismissTimer);
      }, 1500);

      return () => clearTimeout(introTimer);
    }
  }, [user?.id, user?.full_name, speakGreeting]);

  // =========================================================================
  // CONTINUOUS 60FPS DVD BOUNCE ENGINE (ENTIRE 3D MODEL FLOATING OVER SITE)
  // =========================================================================
  useEffect(() => {
    let disposed = false;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (disposed) return;
      animFrameRef.current = requestAnimationFrame(loop);

      const dt = Math.min(0.04, Math.max(0.001, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const container = containerRef.current;
      if (!container) return;

      // Full robot dimensions
      const robotW = 190;
      const robotH = 260;
      const minX = 6;
      const maxX = Math.max(minX + 60, (window.innerWidth || 1200) - robotW - 6);
      const minY = 6;
      const maxY = Math.max(minY + 60, (window.innerHeight || 800) - robotH - 6);

      // Guard against any NaN / non-finite coordinates from disappearing
      if (!Number.isFinite(posRef.current.x) || !Number.isFinite(posRef.current.y)) {
        posRef.current.x = Math.max(minX, Math.floor((window.innerWidth || 1200) * 0.4));
        posRef.current.y = Math.max(minY, Math.floor((window.innerHeight || 800) * 0.2));
      }
      if (!Number.isFinite(velRef.current.vx) || !Number.isFinite(velRef.current.vy)) {
        velRef.current.vx = 55;
        velRef.current.vy = 45;
      }

      // If user is currently dragging Nova directly with primary mouse or touch, pointer drag controls position
      if (isDraggingRef.current) {
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.03)`;
        return;
      }

      // Cruising speed (Reduced to exactly 50% of original speed: 125 -> 62.5 px/sec)
      const baseSpeed = 62.5;
      const targetSpeed = isHoveredRef.current ? baseSpeed * 0.45 : baseSpeed;
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);

      if (!Number.isFinite(currentSpeed) || currentSpeed < 20) {
        velRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
        velRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
      } else {
        const speedFactor = targetSpeed / currentSpeed;
        velRef.current.vx += (velRef.current.vx * speedFactor - velRef.current.vx) * 0.03;
        velRef.current.vy += (velRef.current.vy * speedFactor - velRef.current.vy) * 0.03;
      }

      // Gentle organic freestyle sine drift
      const drift = Math.sin(now * 0.0012) * 8 * dt;
      velRef.current.vx += -velRef.current.vy * 0.05 * dt + drift;
      velRef.current.vy += velRef.current.vx * 0.05 * dt;

      // Update position
      let nx = posRef.current.x + velRef.current.vx * dt;
      let ny = posRef.current.y + velRef.current.vy * dt;

      let hitWall = false;

      // Bounce on Horizontal screen edges (DVD style)
      if (nx >= maxX) {
        nx = maxX;
        velRef.current.vx = -Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 16;
        hitWall = true;
      } else if (nx <= minX) {
        nx = minX;
        velRef.current.vx = Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 16;
        hitWall = true;
      }

      // Bounce on Vertical screen edges (DVD style)
      if (ny >= maxY) {
        ny = maxY;
        velRef.current.vy = -Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 16;
        hitWall = true;
      } else if (ny <= minY) {
        ny = minY;
        velRef.current.vy = Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 16;
        hitWall = true;
      }

      // Always clamp strictly within screen boundaries
      posRef.current.x = Math.min(Math.max(minX, nx), maxX);
      posRef.current.y = Math.min(Math.max(minY, ny), maxY);

      // Handle Bounce Reaction (DVD Color Shift & 3D Robot Reaction)
      if (hitWall) {
        setActiveColorIdx((prev) => prev + 1);
        setBounceCount((prev) => prev + 1);
        setAvatarState('excited');
        setTimeout(() => setAvatarState('idle'), 650);
      }

      // Organic banking tilt in direction of movement + gentle floating hover oscillation
      const tiltDeg = (velRef.current.vx / targetSpeed) * 5 + Math.sin(now * 0.0025) * 2.5;
      const hoverBob = Math.sin(now * 0.003) * 4.5;

      container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y + hoverBob}px, 0px) rotate(${tiltDeg}deg)`;
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);


  // Dragging & Throw (Flick Physics) directly on the 3D model
  // LEFT-CLICK DRAGS NOVA ACROSS SCREEN
  // RIGHT-CLICK IS PRESERVED FOR 3D 360° ORBIT ROTATION
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button (left click = 0 or touch)
    // If user clicked right mouse button (button 2), DO NOT DRAG - let OrbitControls rotate in 3D!
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Prevent default browser drag selection & gestures
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsHovered(false);

    // Guard starting position
    if (!Number.isFinite(posRef.current.x) || !Number.isFinite(posRef.current.y)) {
      posRef.current.x = Math.max(40, Math.floor((window.innerWidth || 1200) * 0.4));
      posRef.current.y = Math.max(40, Math.floor((window.innerHeight || 800) * 0.2));
    }

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    dragHistoryRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      ev.preventDefault();

      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const robotW = 190;
      const robotH = 260;
      const minX = 6;
      const maxX = Math.max(minX + 60, (window.innerWidth || 1200) - robotW - 6);
      const minY = 6;
      const maxY = Math.max(minY + 60, (window.innerHeight || 800) - robotH - 6);

      const targetX = dragStartRef.current.posX + dx;
      const targetY = dragStartRef.current.posY + dy;

      if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
        posRef.current.x = Math.min(Math.max(minX, targetX), maxX);
        posRef.current.y = Math.min(Math.max(minY, targetY), maxY);
      }

      // Immediately update DOM transform for silky responsive drag
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.03)`;
      }

      const now = performance.now();
      dragHistoryRef.current.push({ x: ev.clientX, y: ev.clientY, t: now });
      if (dragHistoryRef.current.length > 5) {
        dragHistoryRef.current.shift();
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      lastTimeRef.current = performance.now();

      // If user tapped without dragging, trigger greeting click
      if (!hasMovedRef.current) {
        handleRobotClick();
        return;
      }

      // Calculate throw release velocity if user flicked Nova (50% speed capped)
      if (dragHistoryRef.current.length >= 2) {
        const first = dragHistoryRef.current[0];
        const last = dragHistoryRef.current[dragHistoryRef.current.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (Number.isFinite(dt) && dt > 0.02 && dt < 0.35) {
          const flickVx = (last.x - first.x) / dt;
          const flickVy = (last.y - first.y) / dt;
          if (Number.isFinite(flickVx) && Number.isFinite(flickVy)) {
            const throwSpeed = Math.hypot(flickVx, flickVy);
            if (throwSpeed > 60) {
              velRef.current.vx = Math.min(150, Math.max(-150, flickVx * 0.45));
              velRef.current.vy = Math.min(150, Math.max(-150, flickVy * 0.45));
              setAvatarState('excited');
              setTimeout(() => setAvatarState('idle'), 700);
            }
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  };

  const handleRobotClick = () => {
    setAvatarState('happy');
    const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : '';
    const namePrefix = firstName ? ` ${firstName}` : '';

    const greetings = [
      `Hi${namePrefix}! Ready to learn today?`,
      `Hello${namePrefix}! Ask me any question anytime!`,
      `Hi${namePrefix}! I'm Nova, your AI study buddy!`,
      `Great to see you${namePrefix}! How can I help you today?`,
      `Keep up the awesome work! I'm right here if you need me!`,
      `Happy learning${namePrefix}! Let's make today great!`,
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    setIsIntro(false);
    setSpeechBubbleText(picked);
    speakGreeting(picked);
    setTimeout(() => {
      setSpeechBubbleText((curr) => (curr === picked ? null : curr));
      setAvatarState('idle');
    }, 3500);
  };

  // Determine Cartoon Thinking Cloud visibility and content
  // 1. While listening: displays live speech transcript
  // 2. While thinking: displays thinking indicator
  // 3. On direct click: displays friendly student greeting
  // 4. On first login: displays quick intro (drag & 360° rotation)
  const isListening = remoteVoiceState === 'listening';
  const isThinking = remoteThinking || remoteVoiceState === 'thinking';

  const hasCloudText = Boolean(
    isListening ||
    isThinking ||
    speechBubbleText
  );

  let cloudMode: 'listening' | 'thinking' | 'intro' | 'speech' = 'speech';
  let cloudText = '';

  if (isListening) {
    cloudMode = 'listening';
    cloudText = remoteTranscript ? `"${remoteTranscript}"` : 'Listening to you... Speak now!';
  } else if (isThinking) {
    cloudMode = 'thinking';
    cloudText = 'Thinking through your question...';
  } else if (speechBubbleText) {
    cloudMode = isIntro ? 'intro' : 'speech';
    cloudText = speechBubbleText;
  }

  // Visibility Coordination:
  // - On the AI Teacher page:
  //   - If panel is not hidden -> floating 3D model disappears.
  //   - If panel is hidden -> floating 3D model appears.
  // - On all other pages -> floating 3D model appears normally.
  const isVisible = !isAiTeacherRoute || isPanelHidden;

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      ref={containerRef}
      aria-label="Nova Full 3D Floating Companion"
      className="fixed top-0 left-0 z-[9999] pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`,
      }}
      onContextMenu={(e) => {
        // Prevent context menu anywhere on Nova container so right-click 360° rotation is seamless
        e.preventDefault();
      }}
    >
      <div
        className="relative pointer-events-auto w-48 h-64 sm:w-52 sm:h-72 flex flex-col items-center justify-between"
        onMouseEnter={() => {
          isHoveredRef.current = true;
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          setIsHovered(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* =========================================================================
            CARTOON THINKING CLOUD (PUFFY COMIC CLOUD WITH 3 TRAILING THOUGHT BUBBLES)
            - Shown while listening (displays live speech transcript)
            - Shown while thinking (displays thinking dots)
            - Shown on first login (quick intro: drag & 360° rotation)
            - Shown on direct click (student greeting)
           ========================================================================= */}
        {hasCloudText && (
          <div
            className="absolute -top-24 sm:-top-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            style={{ width: 'max-content', maxWidth: 'min(300px, 86vw)' }}
          >
            {/* Main Puffy Comic Thought Cloud Body */}
            <div className="relative bg-[#FEFCE8] border-2.5 border-[#0F172A] rounded-[24px] px-3.5 py-2 shadow-[3.5px_3.5px_0px_#0F172A] min-w-[170px] max-w-full">
              {/* Overlapping Cloud Puffs (Scallops) creating authentic cartoon silhouette */}
              <div className="absolute -top-2.5 left-3.5 w-6 h-6 bg-[#FEFCE8] border-t-2 border-l-2 border-[#0F172A] rounded-full pointer-events-none" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#FEFCE8] border-t-2 border-x-2 border-[#0F172A] rounded-full pointer-events-none" />
              <div className="absolute -top-3 right-3.5 w-7 h-7 bg-[#FEFCE8] border-t-2 border-r-2 border-[#0F172A] rounded-full pointer-events-none" />
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-5 bg-[#FEFCE8] border-l-2 border-y-2 border-[#0F172A] rounded-full pointer-events-none" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-5 bg-[#FEFCE8] border-r-2 border-y-2 border-[#0F172A] rounded-full pointer-events-none" />

              {/* Interior Comic Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Status Indicator Badge */}
                <div className="flex items-center gap-1.5 mb-1">
                  {cloudMode === 'listening' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <Mic className="w-3 h-3 text-emerald-700 animate-bounce" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-800">
                        LISTENING
                      </span>
                    </>
                  ) : cloudMode === 'thinking' ? (
                    <>
                      <Brain className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-amber-800">
                        THINKING
                      </span>
                    </>
                  ) : cloudMode === 'intro' ? (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#0F172A]">
                        QUICK INTRO
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#0F172A]">
                        NOVA
                      </span>
                    </>
                  )}
                </div>

                {/* Live Speech Recognition Transcript / Thought Text / Quick Intro / Greeting */}
                <div className="text-xs font-black text-[#0F172A] leading-snug tracking-tight break-words max-h-24 overflow-y-auto px-1">
                  {cloudText}
                  {cloudMode === 'thinking' && (
                    <span className="inline-flex ml-1 space-x-0.5">
                      <span className="animate-bounce inline-block">.</span>
                      <span className="animate-bounce [animation-delay:0.15s] inline-block">.</span>
                      <span className="animate-bounce [animation-delay:0.3s] inline-block">.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trailing Descending Comic Thought Bubbles Leading Down directly to Nova's Head */}
            <div className="flex flex-col items-center mt-1 -space-y-0.5 pointer-events-none">
              {/* Bubble 1 (Upper, larger) */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A]" />
              {/* Bubble 2 (Middle) */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A] translate-x-1" />
              {/* Bubble 3 (Bottom, tiny, nearest to robot head) */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#FEFCE8] border border-[#0F172A] translate-x-2" />
            </div>
          </div>
        )}

        {/* =========================================================================
            FULL 3D ROBOT MODEL CANVAS
            - Left click / touch drag: moves Nova across the screen (DVD freestyle)
            - Right click hold & drag: rotates character 360° in 3D orbit
            - Double click: resets front angle
           ========================================================================= */}
        <div
          onPointerDown={handleDragStart}
          onDoubleClick={() => setResetKey((prev) => prev + 1)}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full flex-1 relative cursor-grab active:cursor-grabbing select-none"
          title="Nova 3D • Right-click hold to rotate 360° • Left-click drag to move • Double-click to reset angle"
        >
          <Nova3DAvatar
            key={`nova-3d-${resetKey}`}
            compact={true}
            transparent={true}
            fullBody={true}
            state={effectiveAvatarState}
            isSpeaking={isSpeaking || remoteVoiceState === 'speaking'}
            interactive={true}
            showControls={false}
            height="100%"
          />
        </div>

        {/* Dynamic Anti-Gravity Thruster Halo */}
        <div className="z-20 flex flex-col items-center pb-1 pointer-events-none">
          <div
            className="w-24 h-4 rounded-full blur-[6px] transition-colors duration-300 nova-thruster-halo"
            style={{ backgroundColor: currentColor }}
          />
        </div>
      </div>
    </aside>
  );
};
