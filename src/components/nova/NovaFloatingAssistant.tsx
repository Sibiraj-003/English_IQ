import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Move } from 'lucide-react';
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

  // 3D Avatar state
  const [avatarState, setAvatarState] = useState<Nova3DState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Continuous 60FPS Direct GPU coordinates & physics references
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerWidth * 0.35)) : 160,
    y: typeof window !== 'undefined' ? Math.max(40, Math.floor(window.innerHeight * 0.25)) : 160,
  });

  // Freestyle Velocity (cruising speed in pixels/sec)
  const velRef = useRef<{ vx: number; vy: number }>({
    vx: (Math.random() > 0.5 ? 1 : -1) * (110 + Math.random() * 25),
    vy: (Math.random() > 0.5 ? 1 : -1) * (95 + Math.random() * 25),
  });

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const avatarClickTriggerRef = useRef<(() => void) | null>(null);

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
  // CONTINUOUS 60FPS DVD BOUNCE ENGINE (PURE 3D MODEL FLOATING OVER SITE)
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

      // If dragging, pointer events directly control position
      if (isDraggingRef.current) {
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.08)`;
        return;
      }

      // Robot dimensions
      const robotW = 130;
      const robotH = 150;
      const minX = 6;
      const maxX = Math.max(minX + 60, (window.innerWidth || 1200) - robotW - 6);
      const minY = 6;
      const maxY = Math.max(minY + 60, (window.innerHeight || 800) - robotH - 6);

      // Cruising speed (moves at full lively speed, slightly relaxed when hovered so it's catchable)
      const baseSpeed = 130;
      const targetSpeed = isHoveredRef.current ? baseSpeed * 0.5 : baseSpeed;
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);

      if (currentSpeed < 40) {
        velRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
        velRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * targetSpeed * 0.7;
      } else {
        const speedFactor = targetSpeed / currentSpeed;
        velRef.current.vx += (velRef.current.vx * speedFactor - velRef.current.vx) * 0.04;
        velRef.current.vy += (velRef.current.vy * speedFactor - velRef.current.vy) * 0.04;
      }

      // Gentle organic freestyle sine drift (flying drone flight curve)
      const drift = Math.sin(now * 0.0016) * 18 * dt;
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
        velRef.current.vy += (Math.random() - 0.5) * 35; // freestyle angle deflection
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
        setTimeout(() => setAvatarState('idle'), 600);
      }

      // Organic banking tilt in direction of movement + floating hover oscillation
      const tiltDeg = (velRef.current.vx / targetSpeed) * 10 + Math.sin(now * 0.004) * 4;
      const hoverBob = Math.sin(now * 0.005) * 5;

      container.style.transform = `translate3d(${nx}px, ${ny + hoverBob}px, 0px) rotate(${tiltDeg}deg)`;
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Periodic Floating Speech Bubble Tips
  useEffect(() => {
    const tips = [
      `I'm Nova! Floating around with you! 🛸`,
      `Catch me if you can! 💫`,
      `Click me to do a 3D spin! ✨`,
      `Flick or drag me across your screen! 🚀`,
    ];

    const timer = setInterval(() => {
      if (!isDraggingRef.current && !speechBubbleText) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setSpeechBubbleText(randomTip);
        setTimeout(() => setSpeechBubbleText(null), 4000);
      }
    }, 20000);

    const initialTimer = setTimeout(() => {
      setSpeechBubbleText(`Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm Nova, floating with you!`);
      setTimeout(() => setSpeechBubbleText(null), 4500);
    }, 1800);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, [user?.full_name, speechBubbleText]);

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
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedRef.current = true;
    }

    const robotW = 130;
    const robotH = 150;

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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
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
          velRef.current.vx = Math.min(380, Math.max(-380, flickVx));
          velRef.current.vy = Math.min(380, Math.max(-380, flickVy));
          setAvatarState('excited');
        }
      }
    }
  };

  const handleRobotClick = () => {
    if (hasMovedRef.current) return;
    setAvatarState('happy');
    const greetings = [
      `I'm Nova! Happy learning!`,
      `Zero gravity flight active!`,
      `Wooo! Look at me fly!`,
      `Need help with anything? I'm right here!`,
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
      aria-label="Nova 3D Floating Companion"
      className="fixed top-0 left-0 z-[9999] pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`,
      }}
    >
      <div
        className="relative pointer-events-auto cursor-grab active:cursor-grabbing w-32 h-36 flex flex-col items-center justify-center group"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleRobotClick}
        title="3D NOVA Robot • Floating all over the website • Click to interact • Drag or flick to throw!"
      >
        {/* Floating Comic Speech Bubble */}
        {speechBubbleText && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] px-2.5 py-1 rounded-xl text-[10px] font-black text-[#0F172A] whitespace-nowrap z-50 animate-bounce flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{speechBubbleText}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-[#0F172A]" />
          </div>
        )}

        {/* Dynamic Anti-Gravity Thruster Glow Beneath Robot */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full blur-[6px] pointer-events-none transition-colors duration-300 nova-thruster-halo"
          style={{ backgroundColor: currentColor }}
        />

        {/* PURE 3D NOVA ROBOT (100% Transparent, No Cards, No Boxes) */}
        <div className="w-full h-full relative pointer-events-none">
          <Nova3DAvatar
            compact={true}
            transparent={true}
            state={avatarState}
            isSpeaking={isSpeaking}
            interactive={false}
            showControls={false}
            height="100%"
          />
        </div>
      </div>
    </aside>
  );
};
