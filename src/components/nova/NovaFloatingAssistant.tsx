import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Move, RotateCcw, Pin, Play, Pause, Compass } from 'lucide-react';
import { Nova3DAvatar } from './Nova3DAvatar';
import { Nova3DState } from './novaAnimations';
import { useAuth } from '../../contexts/AuthContext';
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

  const [bounceCount, setBounceCount] = useState<number>(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);

  // 3D Avatar state
  const [avatarState, setAvatarState] = useState<Nova3DState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Continuous 60FPS Direct GPU coordinates & physics references
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerWidth * 0.4)) : 200,
    y: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerHeight * 0.2)) : 150,
  });

  // Freestyle Velocity (cruising speed in pixels/sec)
  const velRef = useRef<{ vx: number; vy: number }>({
    vx: (Math.random() > 0.5 ? 1 : -1) * (115 + Math.random() * 25),
    vy: (Math.random() > 0.5 ? 1 : -1) * (95 + Math.random() * 25),
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

  // Optional Voice Greeting on Click
  const speakGreeting = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.15;
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
    } catch {}
  }, []);

  // =========================================================================
  // CONTINUOUS 60FPS DVD BOUNCE ENGINE (ENTIRE 3D MODEL FLOATING OVER SITE)
  // =========================================================================
  useEffect(() => {
    let disposed = false;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (disposed) return;
      animFrameRef.current = requestAnimationFrame(loop);

      const dt = Math.min(0.04, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const container = containerRef.current;
      if (!container) return;

      // If user is currently dragging Nova by the handle, pointer drag controls position
      if (isDraggingRef.current) {
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.05)`;
        return;
      }

      // If user pinned Nova in place, hover gently at target position
      if (isPinned) {
        const hoverBob = Math.sin(now * 0.003) * 6;
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y + hoverBob}px, 0px)`;
        return;
      }

      // Full robot dimensions
      const robotW = 190;
      const robotH = 260;
      const minX = 6;
      const maxX = Math.max(minX + 60, (window.innerWidth || 1200) - robotW - 6);
      const minY = 6;
      const maxY = Math.max(minY + 60, (window.innerHeight || 800) - robotH - 6);

      // Cruising speed
      const baseSpeed = 125;
      const targetSpeed = isHoveredRef.current ? baseSpeed * 0.45 : baseSpeed;
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);

      if (currentSpeed < 40) {
        velRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
        velRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
      } else {
        const speedFactor = targetSpeed / currentSpeed;
        velRef.current.vx += (velRef.current.vx * speedFactor - velRef.current.vx) * 0.04;
        velRef.current.vy += (velRef.current.vy * speedFactor - velRef.current.vy) * 0.04;
      }

      // Gentle organic freestyle sine drift
      const drift = Math.sin(now * 0.0016) * 16 * dt;
      velRef.current.vx += -velRef.current.vy * 0.08 * dt + drift;
      velRef.current.vy += velRef.current.vx * 0.08 * dt;

      // Update position
      let nx = posRef.current.x + velRef.current.vx * dt;
      let ny = posRef.current.y + velRef.current.vy * dt;

      let hitWall = false;

      // Bounce on Horizontal screen edges (DVD style)
      if (nx >= maxX) {
        nx = maxX;
        velRef.current.vx = -Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 35;
        hitWall = true;
      } else if (nx <= minX) {
        nx = minX;
        velRef.current.vx = Math.abs(velRef.current.vx);
        velRef.current.vy += (Math.random() - 0.5) * 35;
        hitWall = true;
      }

      // Bounce on Vertical screen edges (DVD style)
      if (ny >= maxY) {
        ny = maxY;
        velRef.current.vy = -Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 35;
        hitWall = true;
      } else if (ny <= minY) {
        ny = minY;
        velRef.current.vy = Math.abs(velRef.current.vy);
        velRef.current.vx += (Math.random() - 0.5) * 35;
        hitWall = true;
      }

      posRef.current.x = nx;
      posRef.current.y = ny;

      // Handle Bounce Reaction (DVD Color Shift & 3D Robot Reaction)
      if (hitWall) {
        setActiveColorIdx((prev) => prev + 1);
        setBounceCount((prev) => prev + 1);
        setAvatarState('excited');
        setTimeout(() => setAvatarState('idle'), 650);
      }

      // Organic banking tilt in direction of movement + floating hover oscillation
      const tiltDeg = (velRef.current.vx / targetSpeed) * 8 + Math.sin(now * 0.0035) * 3.5;
      const hoverBob = Math.sin(now * 0.004) * 6;

      container.style.transform = `translate3d(${nx}px, ${ny + hoverBob}px, 0px) rotate(${tiltDeg}deg)`;
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPinned]);

  // Periodic Floating Speech Bubble Tips
  useEffect(() => {
    const tips = [
      `I'm Nova! Drag me anywhere or rotate me 360°! 🛸`,
      `Zero gravity flight active! 💫`,
      `You can spin my 3D model with your mouse! ✨`,
      `Drag my move handle to place me where you want! 🚀`,
    ];

    const timer = setInterval(() => {
      if (!isDraggingRef.current && !speechBubbleText) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setSpeechBubbleText(randomTip);
        setTimeout(() => setSpeechBubbleText(null), 4000);
      }
    }, 22000);

    const initialTimer = setTimeout(() => {
      setSpeechBubbleText(`Hello ${user?.full_name?.split(' ')[0] || 'there'}! Rotate me 360° or drag me anywhere!`);
      setTimeout(() => setSpeechBubbleText(null), 5000);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, [user?.full_name, speechBubbleText]);

  // Dragging & Throw (Flick Physics) - Triggered specifically from the Move handle or Thruster base
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedRef.current = true;
    }

    const robotW = 190;
    const robotH = 260;

    posRef.current.x = Math.min(
      Math.max(6, dragStartRef.current.posX + dx),
      window.innerWidth - robotW - 6
    );
    posRef.current.y = Math.min(
      Math.max(6, dragStartRef.current.posY + dy),
      window.innerHeight - robotH - 6
    );

    const now = performance.now();
    dragHistoryRef.current.push({ x: e.clientX, y: e.clientY, t: now });
    if (dragHistoryRef.current.length > 5) {
      dragHistoryRef.current.shift();
    }
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Calculate throw release velocity if user flicked Nova!
    if (!isPinned && dragHistoryRef.current.length >= 2) {
      const first = dragHistoryRef.current[0];
      const last = dragHistoryRef.current[dragHistoryRef.current.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.02 && dt < 0.3) {
        const flickVx = (last.x - first.x) / dt;
        const flickVy = (last.y - first.y) / dt;
        const throwSpeed = Math.hypot(flickVx, flickVy);
        if (throwSpeed > 80) {
          velRef.current.vx = Math.min(380, Math.max(-380, flickVx));
          velRef.current.vy = Math.min(380, Math.max(-380, flickVy));
          setAvatarState('excited');
        }
      }
    }
  };

  const handleRobotClick = () => {
    setAvatarState('happy');
    const greetings = [
      `Hi! I'm Nova! Happy learning!`,
      `Zero gravity flight active!`,
      `Drag my 3D body to rotate me 360°!`,
      `Grab my handle to move me anywhere!`,
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    setSpeechBubbleText(picked);
    speakGreeting(picked);
    setTimeout(() => {
      setSpeechBubbleText(null);
      setAvatarState('idle');
    }, 3200);
  };

  return (
    <aside
      ref={containerRef}
      aria-label="Nova Full 3D Floating Companion"
      className="fixed top-0 left-0 z-[9999] pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`,
      }}
    >
      <div
        className="relative pointer-events-auto w-48 h-64 sm:w-52 sm:h-72 flex flex-col items-center justify-between group"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        {/* Floating Comic Speech Bubble */}
        {speechBubbleText && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] px-2.5 py-1 rounded-xl text-[10px] font-black text-[#0F172A] whitespace-nowrap z-50 animate-bounce flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{speechBubbleText}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-[#0F172A]" />
          </div>
        )}

        {/* Top Control Bar: Move & Drag Handle + Flight Controls */}
        <div className="z-30 flex items-center gap-1 transition-opacity duration-200 opacity-80 group-hover:opacity-100">
          {/* Dedicated Drag & Move Handle */}
          <div
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            className="cursor-grab active:cursor-grabbing px-2 py-0.5 bg-white/95 hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-full text-[8.5px] font-black uppercase text-[#0F172A] flex items-center gap-1 transition-all active:translate-x-[1px] active:translate-y-[1px]"
            title="Click & Drag to move Nova anywhere on your screen"
          >
            <Move className="w-3 h-3 text-[#0F172A]" />
            <span>DRAG MOVE</span>
          </div>

          {/* Toggle DVD Float vs Pinned in place */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned((prev) => !prev);
            }}
            className={`px-1.5 py-0.5 border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] rounded-full text-[8px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] ${
              isPinned ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-white/95 hover:bg-slate-100 text-slate-800'
            }`}
            title={isPinned ? 'Nova is Pinned in place (Click to resume DVD float)' : 'Nova is Floating (Click to pin here)'}
          >
            {isPinned ? <Pin className="w-2.5 h-2.5" /> : <Compass className="w-2.5 h-2.5 animate-spin" />}
            <span>{isPinned ? 'PINNED' : 'FLOAT'}</span>
          </button>

          {/* Reset 3D Angle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setResetKey((prev) => prev + 1);
            }}
            className="p-1 bg-white/95 hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] rounded-full text-[#0F172A] cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            title="Reset 3D camera angle to front"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* FULL 3D ROBOT MODEL CANVAS (Interactive 360° Orbit Rotation) */}
        <div
          className="w-full flex-1 relative cursor-grab active:cursor-grabbing"
          title="Drag directly on the 3D robot to rotate 360°! Click to react!"
        >
          <Nova3DAvatar
            key={`nova-3d-${resetKey}`}
            compact={true}
            transparent={true}
            fullBody={true}
            state={avatarState}
            isSpeaking={isSpeaking}
            interactive={true}
            showControls={false}
            onAvatarClick={handleRobotClick}
            height="100%"
          />
        </div>

        {/* Dynamic Anti-Gravity Thruster Halo & Bottom Move Base */}
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          className="z-20 cursor-grab active:cursor-grabbing flex flex-col items-center pb-1"
          title="Drag by thruster base to move Nova anywhere"
        >
          <div
            className="w-24 h-4 rounded-full blur-[6px] transition-colors duration-300 nova-thruster-halo"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-[7px] font-black uppercase text-slate-600 bg-white/80 border border-[#0F172A]/40 px-1.5 py-0.2 rounded-full mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            ROTATE 360° // MOVE
          </span>
        </div>
      </div>
    </aside>
  );
};
