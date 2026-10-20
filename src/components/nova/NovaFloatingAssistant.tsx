import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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

  const [bounceCount, setBounceCount] = useState<number>(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
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

      // If user is currently dragging Nova directly, pointer drag controls position
      if (isDraggingRef.current) {
        container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px) scale(1.04)`;
        return;
      }

      // Full robot dimensions
      const robotW = 190;
      const robotH = 260;
      const minX = 6;
      const maxX = Math.max(minX + 60, (window.innerWidth || 1200) - robotW - 6);
      const minY = 6;
      const maxY = Math.max(minY + 60, (window.innerHeight || 800) - robotH - 6);

      // Cruising speed (Reduced to exactly 50% of original speed: 125 -> 62.5 px/sec)
      const baseSpeed = 62.5;
      const targetSpeed = isHoveredRef.current ? baseSpeed * 0.45 : baseSpeed;
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);

      if (currentSpeed < 20) {
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

      posRef.current.x = nx;
      posRef.current.y = ny;

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

  // Dragging & Throw (Flick Physics) directly on the 3D model
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button (left click or touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    dragHistoryRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasMovedRef.current = true;
      }

      const robotW = 190;
      const robotH = 260;

      posRef.current.x = Math.min(
        Math.max(6, dragStartRef.current.posX + dx),
        (window.innerWidth || 1200) - robotW - 6
      );
      posRef.current.y = Math.min(
        Math.max(6, dragStartRef.current.posY + dy),
        (window.innerHeight || 800) - robotH - 6
      );

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
        if (dt > 0.02 && dt < 0.3) {
          const flickVx = (last.x - first.x) / dt;
          const flickVy = (last.y - first.y) / dt;
          const throwSpeed = Math.hypot(flickVx, flickVy);
          if (throwSpeed > 60) {
            velRef.current.vx = Math.min(160, Math.max(-160, flickVx * 0.5));
            velRef.current.vy = Math.min(160, Math.max(-160, flickVy * 0.5));
            setAvatarState('excited');
            setTimeout(() => setAvatarState('idle'), 700);
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  };

  const handleRobotClick = () => {
    setAvatarState('happy');
    const greetings = [
      `Hi! I'm Nova! Happy learning!`,
      `Zero gravity flight active!`,
      `Drag me directly to move or rotate 360°!`,
      `I'm your 3D study companion!`,
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    setSpeechBubbleText(picked);
    speakGreeting(picked);
    setTimeout(() => {
      setSpeechBubbleText(null);
      setAvatarState('idle');
    }, 3200);
  };

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
    >
      <div
        className="relative pointer-events-auto w-48 h-64 sm:w-52 sm:h-72 flex flex-col items-center justify-between"
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

        {/* FULL 3D ROBOT MODEL CANVAS (Direct Touch to Move across screen & Rotate 360°) */}
        <div
          onPointerDown={handleDragStart}
          onDoubleClick={() => setResetKey((prev) => prev + 1)}
          className="w-full flex-1 relative cursor-grab active:cursor-grabbing select-none"
          title="Drag anywhere on 3D Nova to move and rotate! (Double click to reset front angle)"
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
