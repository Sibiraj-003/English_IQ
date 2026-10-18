import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  Sparkles,
  Volume2,
  Mic,
  Brain,
  HelpCircle,
  CheckCircle2,
  Smile,
  AlertCircle,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { NovaAvatarExpression, CameraAnalysisResult } from '../types';
import { NovaVoiceState } from './NovaAvatar';

interface NovaRobotCompanionProps {
  expression?: NovaAvatarExpression;
  voiceState?: NovaVoiceState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  cameraActive: boolean;
  onToggleCamera: () => void;
  cameraAnalysis: CameraAnalysisResult | null;
  videoRef: React.RefObject<any>;
  onReactionHelpClick?: (prompt: string) => void;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

export const NovaRobotCompanion: React.FC<NovaRobotCompanionProps> = ({
  expression = 'greeting',
  voiceState = 'idle',
  isSpeaking = false,
  isThinking = false,
  cameraActive,
  onToggleCamera,
  cameraAnalysis,
  videoRef,
  onReactionHelpClick,
  isCompact = false,
  onToggleCompact,
}) => {
  const [showWebcamPreview, setShowWebcamPreview] = useState(true);

  // Effective voice state
  const effectiveState: NovaVoiceState =
    voiceState || (isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle');

  // Reaction resolution
  const reaction = cameraAnalysis?.student_reaction || (cameraActive ? 'focused' : undefined);
  const confidence = cameraAnalysis?.reaction_confidence
    ? Math.round(cameraAnalysis.reaction_confidence * 100)
    : 85;

  // Pedagogical reaction config
  const getReactionConfig = () => {
    switch (reaction) {
      case 'confused':
        return {
          label: 'CONFUSED / PUZZLED',
          color: 'bg-[#FED7AA] text-amber-950 border-amber-600',
          dotColor: 'bg-amber-500 animate-ping',
          icon: HelpCircle,
          tip: 'I noticed you might be puzzled. Would you like a simpler real-world analogy?',
          actionPrompt: 'Can you explain that concept in a simpler way with an everyday analogy?',
          actionText: 'Explain Simpler',
        };
      case 'happy':
        return {
          label: 'CONFIDENT / HAPPY',
          color: 'bg-[#A7F3D0] text-emerald-950 border-emerald-600',
          dotColor: 'bg-emerald-500',
          icon: Smile,
          tip: "You've got that lightbulb moment! Ready for a quick challenge?",
          actionPrompt: 'Ask me a quick concept challenge question to test my understanding!',
          actionText: 'Challenge Me',
        };
      case 'distracted':
        return {
          label: 'LOOKING AWAY',
          color: 'bg-[#FBCFE8] text-rose-950 border-rose-600',
          dotColor: 'bg-rose-500 animate-pulse',
          icon: Eye,
          tip: 'Taking a breather? Let me know whenever you want to resume!',
          actionPrompt: 'Give me a 1-minute summary of where we are so far.',
          actionText: 'Quick Summary',
        };
      case 'thinking':
        return {
          label: 'PONDERING / THINKING',
          color: 'bg-[#C4B5FD] text-indigo-950 border-indigo-600',
          dotColor: 'bg-indigo-500 animate-pulse',
          icon: Brain,
          tip: 'Take your time to think it through! I am right here.',
          actionPrompt: 'Can you break this down into 3 simple bullet points?',
          actionText: 'Break Into Steps',
        };
      case 'focused':
      default:
        return {
          label: 'FOCUSED & ENGAGED',
          color: 'bg-[#BAE6FD] text-sky-950 border-sky-600',
          dotColor: 'bg-sky-500',
          icon: Lightbulb,
          tip: 'Great focus! Ask any follow-up question or explore the next idea.',
          actionPrompt: 'What is a real-world example of how this is applied?',
          actionText: 'Real Example',
        };
    }
  };

  const reactionConfig = getReactionConfig();
  const ReactionIcon = reactionConfig.icon;

  // Waveform bar visualizer heights generator based on voice state
  const isAudioActive = effectiveState === 'listening' || effectiveState === 'speaking';

  return (
    <div className="flex flex-col bg-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] rounded-lg overflow-hidden font-mono text-white select-none transition-all duration-300 w-full">
      {/* 1. COMPANION TOP BAR / CYBER TITLE */}
      <div className="px-2.5 py-1.5 bg-[#1E293B] border-b-2 border-[#334155] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-[11px] tracking-wider text-[#A7F3D0]">
            NOVA AI // MENTOR
          </span>
          <span className="text-[9px] px-1 py-0.2 bg-[#334155] text-slate-200 border border-slate-500">
            LIVE HUD
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Camera Toggle Button */}
          <button
            onClick={onToggleCamera}
            className={`p-1 border border-slate-600 transition-colors flex items-center gap-1 text-[10px] font-bold ${
              cameraActive
                ? 'bg-[#A7F3D0] text-[#0F172A] hover:bg-emerald-300'
                : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
            }`}
            title={cameraActive ? 'Camera active (analyzing reactions)' : 'Enable camera to analyze reactions'}
          >
            {cameraActive ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3 text-slate-400" />}
            <span className="hidden sm:inline">{cameraActive ? 'CAM ON' : 'CAM OFF'}</span>
          </button>

          {/* Compact / Expand Toggle */}
          {onToggleCompact && (
            <button
              onClick={onToggleCompact}
              className="p-1 hover:bg-[#334155] text-slate-300 border border-slate-600"
              title={isCompact ? 'Expand avatar' : 'Compact view'}
            >
              {isCompact ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {!isCompact ? (
        <>
          {/* 2. MAIN ROBOT AVATAR DISPLAY (MATCHING ATTACHED IMAGE) */}
          <div className="relative p-3 bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#0B0F19] flex flex-col items-center justify-center overflow-hidden min-h-[170px]">
            {/* Cyber Circuit Lines & Corner Brackets in Background */}
            <div className="absolute inset-2 border border-indigo-500/20 rounded-md pointer-events-none" />
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-indigo-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-indigo-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-indigo-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-indigo-400 pointer-events-none" />

            {/* Glowing Aura / Particle Stars */}
            <div className="absolute top-4 right-5 text-indigo-300/40 animate-pulse">✦</div>
            <div className="absolute bottom-5 left-5 text-indigo-300/30 animate-pulse delay-300">✦</div>
            <div className="absolute top-8 left-6 text-indigo-400/30 text-[9px]">★</div>

            {/* Glowing Holographic Halo over robot */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-14 h-3.5 mb-1 rounded-full border-2 border-indigo-300 bg-indigo-500/20 shadow-[0_0_15px_rgba(167,139,250,0.9)] animate-halo-pulse transition-all ${
                  effectiveState === 'speaking'
                    ? 'border-indigo-200 shadow-[0_0_22px_rgba(196,181,253,1)] scale-110'
                    : effectiveState === 'listening'
                    ? 'border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.9)] scale-105'
                    : ''
                }`}
              />

              {/* Robot Image Container with Floating Hover Animation */}
              <div className="relative group animate-nova-float">
                {/* Pulsing Headphone Glow Ring */}
                {isAudioActive && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/60 animate-ping pointer-events-none" />
                )}

                <img
                  src="/assets/nova-robot.png"
                  alt="NOVA AI Companion Robot"
                  className="w-28 h-28 object-contain drop-shadow-[0_4px_16px_rgba(99,102,241,0.5)] transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback to root path if assets not reached
                    (e.target as HTMLImageElement).src = '/nova-robot.png';
                  }}
                />

                {/* Pedagogy Emotion Thought Bubble (If student is confused or thinking) */}
                {reaction === 'confused' && (
                  <div className="absolute -top-3 -right-6 z-20 bg-[#FDE68A] text-[#0F172A] border-2 border-[#0F172A] px-2 py-0.5 text-[9px] font-extrabold shadow-[2px_2px_0px_#0F172A] rounded-md animate-bounce">
                    Need a hint? 💡
                  </div>
                )}
                {reaction === 'happy' && (
                  <div className="absolute -top-3 -right-6 z-20 bg-[#A7F3D0] text-[#0F172A] border-2 border-[#0F172A] px-2 py-0.5 text-[9px] font-extrabold shadow-[2px_2px_0px_#0F172A] rounded-md">
                    Brilliant! ★
                  </div>
                )}
              </div>
            </div>

            {/* 3. REPRODUCING THE ATTACHED IMAGE'S BOTTOM HUD WAVEFORM PILL */}
            <div className="w-full mt-2.5 z-10">
              <div className="w-full bg-[#090D16] border-2 border-[#334155] rounded-xl px-3 py-1.5 flex items-center justify-between shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveState === 'listening'
                        ? 'bg-emerald-400 animate-ping'
                        : effectiveState === 'speaking'
                        ? 'bg-indigo-400 animate-pulse'
                        : effectiveState === 'thinking'
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[11px] font-black tracking-wider text-slate-200">
                    {effectiveState === 'listening'
                      ? 'LISTENING...'
                      : effectiveState === 'speaking'
                      ? 'SPEAKING...'
                      : effectiveState === 'thinking'
                      ? 'THINKING...'
                      : cameraActive
                      ? 'OBSERVING...'
                      : 'READY'}
                  </span>
                </div>

                {/* Animated Audio Equalizer Waveform Bars (like in user image) */}
                <div className="flex items-center gap-0.5 h-4">
                  {[4, 8, 14, 18, 12, 16, 20, 14, 10, 16, 12, 6].map((h, i) => {
                    const dynamicHeight = isAudioActive
                      ? Math.max(3, Math.round(h * (i % 2 === 0 ? 1.1 : 0.8)))
                      : 4;
                    return (
                      <span
                        key={i}
                        className={`w-0.5 rounded-full transition-all duration-150 ${
                          effectiveState === 'listening'
                            ? 'bg-emerald-400'
                            : effectiveState === 'speaking'
                            ? 'bg-indigo-400'
                            : 'bg-emerald-600/50'
                        } ${isAudioActive ? 'animate-audio-wave' : ''}`}
                        style={{
                          height: `${dynamicHeight}px`,
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. LIVE CAMERA & STUDENT REACTION ANALYSIS HUD */}
          <div className="p-2.5 bg-[#0F172A] border-t-2 border-[#1E293B] space-y-2">
            {cameraActive ? (
              <div className="space-y-2">
                {/* Live Webcam Frame with Face Detection HUD Overlays */}
                <div className="relative border-2 border-indigo-500/60 rounded-md overflow-hidden bg-black">
                  <video
                    ref={videoRef as any}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-24 object-cover"
                  />

                  {/* Face Detection Bounding Box Overlay */}
                  <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] font-bold text-emerald-400 bg-black/70 px-1.5 py-0.5 rounded">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        FACE DETECTED
                      </span>
                      <span>{cameraAnalysis?.face_detected !== false ? '100% LOCK' : 'SCANNING'}</span>
                    </div>

                    {/* HUD Center Crosshair */}
                    <div className="self-center w-12 h-12 border border-emerald-400/50 rounded-xs flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </div>

                    {/* Gaze & Signal note */}
                    <div className="flex items-center justify-between text-[8px] text-slate-300 bg-black/60 px-1 py-0.5">
                      <span>GAZE: {cameraAnalysis?.gaze_direction?.toUpperCase() || 'CENTER'}</span>
                      <span>PRIVACY: LOCAL SNAPSHOT</span>
                    </div>
                  </div>
                </div>

                {/* Reaction Status Badge */}
                <div
                  className={`p-1.5 rounded-md border text-[11px] flex items-center justify-between font-bold ${reactionConfig.color}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${reactionConfig.dotColor}`} />
                    <ReactionIcon className="w-3.5 h-3.5" />
                    <span>{reactionConfig.label}</span>
                  </div>
                  <span className="text-[10px] font-extrabold opacity-90">{confidence}%</span>
                </div>

                {/* Reaction-based Pedagogical Assist Prompt */}
                <div className="bg-[#1E293B] border border-slate-700 p-2 rounded-md space-y-1.5">
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {cameraAnalysis?.pedagogical_suggestion || reactionConfig.tip}
                  </p>

                  {onReactionHelpClick && (
                    <button
                      onClick={() => onReactionHelpClick(reactionConfig.actionPrompt)}
                      className="w-full py-1 px-2 text-[10px] font-extrabold bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] hover:bg-amber-300 active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      <span>{reactionConfig.actionText}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Camera Inactive State: Call to Action */
              <div className="bg-[#1E293B] border border-slate-700 p-2.5 rounded-md space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-200">
                  <Camera className="w-4 h-4 text-[#A7F3D0]" />
                  <span>Reaction-Based Teaching</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Enable live camera to let NOVA detect your reactions (puzzled, focused, thinking) and adapt lessons automatically!
                </p>
                <button
                  onClick={onToggleCamera}
                  className="w-full py-1.5 px-2 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-emerald-300 font-extrabold text-[11px] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ENABLE FACE & REACTION MONITOR</span>
                </button>
                <span className="text-[9px] text-slate-500 block">
                  Zero video recording • 100% privacy protected
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Compact Minimized State (for small viewports or when collapsed) */
        <div className="p-2 bg-[#1E1B4B] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/assets/nova-robot.png"
              alt="NOVA"
              className="w-8 h-8 object-contain rounded-md border border-indigo-400 bg-black/40"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/nova-robot.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white">NOVA</span>
                <span className="text-[9px] px-1 py-0.2 bg-emerald-400 text-black font-bold">
                  {effectiveState.toUpperCase()}
                </span>
              </div>
              <p className="text-[9px] text-slate-300 truncate max-w-[120px]">
                {cameraActive ? `Reaction: ${reactionConfig.label}` : 'Camera Standby'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleCompact}
            className="p-1 text-slate-300 hover:text-white border border-slate-600 bg-[#334155]"
            title="Expand NOVA HUD"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NovaRobotCompanion;
