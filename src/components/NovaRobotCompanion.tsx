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
  Boxes,
} from 'lucide-react';
import { NovaAvatarExpression, CameraAnalysisResult } from '../types';
import { NovaAvatar, NovaVoiceState, NovaState } from './NovaAvatar';
import { Nova3DRobot } from './Nova3DRobot';

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
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() => {
    try {
      return localStorage.getItem('nova_avatar_view_mode') === '2d' ? '2d' : '3d';
    } catch {
      return '3d';
    }
  });

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === '3d' ? '2d' : '3d';
      try {
        localStorage.setItem('nova_avatar_view_mode', next);
      } catch {}
      return next;
    });
  };

  // Effective voice state
  const effectiveState: NovaVoiceState =
    voiceState || (isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle');

  // Reaction resolution
  const reaction = cameraAnalysis?.student_reaction || (cameraActive ? 'focused' : undefined);

  // Resolve avatar state from camera analysis reaction, expression, and voice state
  let avatarState: NovaState = 'idle';
  if (effectiveState === 'speaking') {
    avatarState = 'speaking';
  } else if (effectiveState === 'listening') {
    avatarState = 'listening';
  } else if (effectiveState === 'thinking') {
    avatarState = 'thinking';
  } else if (reaction === 'confused') {
    avatarState = 'confused';
  } else if (reaction === 'happy') {
    avatarState = 'happy';
  } else if (reaction === 'thinking') {
    avatarState = 'thinking';
  } else if (expression === 'celebrating') {
    avatarState = 'success';
  } else if (expression === 'encouraging') {
    avatarState = 'happy';
  } else if (expression === 'concerned') {
    avatarState = 'confused';
  }
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

  return (
    <div className="flex flex-col bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] font-mono text-[#0F172A] select-none transition-all duration-300 w-full shrink-0">
      {/* 1. COMPANION TOP BAR */}
      <div className="px-3 py-2 bg-[#C4B5FD] border-b-2 border-[#0F172A] flex items-center justify-between gap-2 text-xs select-none shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-[#0F172A] shrink-0" />
          <span className="font-black text-xs tracking-wider text-[#0F172A] whitespace-nowrap truncate">
            NOVA AI
          </span>
          <span className="text-[9px] px-1.5 py-1 bg-[#FDE68A] text-[#0F172A] border-2 border-[#0F172A] font-extrabold shadow-[1.5px_1.5px_0px_#0F172A] whitespace-nowrap shrink-0 leading-none">
            LIVE HUD
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 3D / 2D Avatar Toggle Button */}
          <button
            onClick={toggleViewMode}
            className={`px-2 py-1 border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-[10px] font-black flex items-center gap-1 shrink-0 leading-none transition-all ${
              viewMode === '3d'
                ? 'bg-[#FDE68A] hover:bg-[#FCD34D] text-[#0F172A]'
                : 'bg-white hover:bg-slate-100 text-slate-700'
            }`}
            title="Switch between 3D Mini Robot and 2D Vector Avatar"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{viewMode === '3d' ? '3D' : '2D'}</span>
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={onToggleCamera}
            className={`px-2 py-1 border-2 border-[#0F172A] transition-all flex items-center gap-1 text-[10px] font-black active:translate-x-[1px] active:translate-y-[1px] cursor-pointer whitespace-nowrap shrink-0 leading-none ${
              cameraActive
                ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-emerald-300'
                : 'bg-white text-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-slate-100'
            }`}
            title={cameraActive ? 'Camera active (analyzing reactions)' : 'Enable camera to analyze reactions'}
          >
            {cameraActive ? (
              <Camera className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CameraOff className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            <span className="whitespace-nowrap">{cameraActive ? 'CAM ON' : 'CAM OFF'}</span>
          </button>

          {/* Compact / Expand Toggle */}
          {onToggleCompact && (
            <button
              onClick={onToggleCompact}
              className="p-1 bg-white hover:bg-[#FDE68A] text-[#0F172A] border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
              title={isCompact ? 'Expand avatar' : 'Compact view'}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!isCompact ? (
        <>
          {/* 2. MAIN ROBOT AVATAR DISPLAY (3D OR 2D) */}
          <div className="relative bg-[#FEFCE8] border-b-2 border-[#0F172A] flex flex-col items-center justify-center shrink-0 overflow-hidden">
            {/* Neo-brutalist corner brackets */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-[#0F172A] z-20 pointer-events-none" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#0F172A] z-20 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#0F172A] z-20 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#0F172A] z-20 pointer-events-none" />

            {viewMode === '3d' ? (
              <div className="w-full relative">
                <Nova3DRobot
                  modelPath="/models/mini_robot.glb"
                  voiceState={voiceState}
                  avatarState={avatarState}
                  isSpeaking={isSpeaking}
                  isThinking={isThinking}
                  height="260px"
                />
              </div>
            ) : (
              /* Robot Vector SVG Companion Display */
              <div className="relative z-10 p-3.5 flex flex-col items-center justify-center shrink-0">
                <NovaAvatar
                  state={avatarState}
                  size="md"
                  speaking={effectiveState === 'speaking'}
                  listening={effectiveState === 'listening'}
                  showStatus={false}
                  interactive={true}
                  className="nova--companion"
                />
              </div>
            )}

            {/* Pedagogy Emotion Thought Bubble (If student is confused or thinking) */}
            {reaction === 'confused' && (
              <div className="absolute top-3 right-3 z-30 bg-[#FDE68A] text-[#0F172A] border-2 border-[#0F172A] px-2 py-0.5 text-[9px] font-extrabold shadow-[2px_2px_0px_#0F172A] rounded-none animate-bounce">
                Need a hint? 💡
              </div>
            )}
            {reaction === 'happy' && (
              <div className="absolute top-3 right-3 z-30 bg-[#A7F3D0] text-[#0F172A] border-2 border-[#0F172A] px-2 py-0.5 text-[9px] font-extrabold shadow-[2px_2px_0px_#0F172A] rounded-none">
                Brilliant! ★
              </div>
            )}
          </div>

          {/* 4. LIVE CAMERA & STUDENT REACTION ANALYSIS HUD */}
          <div className="p-3 bg-[#F8FAFC] space-y-2.5 shrink-0">
            {cameraActive ? (
              <div className="space-y-2">
                {/* Live Webcam Frame with Face Detection HUD Overlays */}
                <div className="relative border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef as any}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Face Detection Bounding Box Overlay */}
                  <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] font-black text-emerald-300 bg-black/80 px-2 py-0.5 border border-emerald-400/40">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        FACE DETECTED
                      </span>
                      <span>{cameraAnalysis?.face_detected !== false ? '100% LOCK' : 'SCANNING'}</span>
                    </div>

                    {/* HUD Center Crosshair */}
                    <div className="self-center w-24 h-28 border-2 border-emerald-400/80 rounded-none flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    </div>

                    {/* Gaze & Signal note */}
                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-200 bg-black/80 px-1.5 py-0.5 border border-slate-700">
                      <span>GAZE: {cameraAnalysis?.gaze_direction?.toUpperCase() || 'CENTER'}</span>
                      <span>PRIVACY: LOCAL SNAPSHOT</span>
                    </div>
                  </div>
                </div>

                {/* Reaction Status Badge */}
                <div
                  className={`p-2 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-xs flex items-center justify-between font-black ${reactionConfig.color}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${reactionConfig.dotColor}`} />
                    <ReactionIcon className="w-3.5 h-3.5" />
                    <span>{reactionConfig.label}</span>
                  </div>
                  <span className="text-[10px] font-black opacity-90">{confidence}%</span>
                </div>

                {/* Reaction-based Pedagogical Assist Prompt */}
                <div className="bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] p-2.5 space-y-2">
                  <p className="text-[11px] font-bold text-[#0F172A] leading-tight">
                    {cameraAnalysis?.pedagogical_suggestion || reactionConfig.tip}
                  </p>

                  {onReactionHelpClick && (
                    <button
                      onClick={() => onReactionHelpClick(reactionConfig.actionPrompt)}
                      className="w-full py-1.5 px-2 text-xs font-black bg-[#FDE68A] hover:bg-amber-300 text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>{reactionConfig.actionText}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Camera Inactive State: Neo-Brutalist Call to Action */
              <div className="bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] p-3 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#0F172A]">
                  <Camera className="w-4 h-4 text-[#0F172A]" />
                  <span>Reaction-Based Teaching</span>
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                  Enable live camera to let NOVA detect your reactions (puzzled, focused, thinking) and adapt lessons automatically!
                </p>
                <button
                  onClick={onToggleCamera}
                  className="w-full py-2 px-3 bg-[#A7F3D0] hover:bg-emerald-300 text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] font-black text-xs active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>ENABLE FACE & REACTION MONITOR</span>
                </button>
                <span className="text-[9px] font-bold text-slate-500 block">
                  Zero video recording • 100% privacy protected
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Compact Minimized State (Neo-Brutalist) */
        <div className="p-2 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 overflow-hidden flex items-center justify-center border-2 border-[#0F172A] bg-white shadow-[1px_1px_0px_#0F172A] shrink-0">
              <NovaAvatar
                state={avatarState}
                size="sm"
                speaking={effectiveState === 'speaking'}
                listening={effectiveState === 'listening'}
                showStatus={false}
                className="scale-[0.45] origin-top -mt-3"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-[#0F172A]">NOVA</span>
                <span className="text-[9px] px-1 py-0.2 bg-[#A7F3D0] text-[#0F172A] font-black border border-[#0F172A]">
                  {effectiveState.toUpperCase()}
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-700 truncate max-w-[120px]">
                {cameraActive ? `Reaction: ${reactionConfig.label}` : 'Camera Standby'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleCompact}
            className="p-1 text-[#0F172A] hover:bg-[#FDE68A] border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A] bg-white cursor-pointer"
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
