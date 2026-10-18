import React from 'react';
import { NovaAvatarExpression } from '../types';
import { Sparkles, Bot, Brain, Smile, CheckCircle, AlertCircle, Mic, Volume2 } from 'lucide-react';

export type NovaVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface NovaAvatarProps {
  expression?: NovaAvatarExpression;
  voiceState?: NovaVoiceState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'compact' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const NovaAvatar: React.FC<NovaAvatarProps> = ({
  expression = 'greeting',
  voiceState,
  isSpeaking = false,
  isThinking = false,
  size = 'md',
  showLabel = true,
}) => {
  // Determine effective state
  const effectiveVoiceState: NovaVoiceState =
    voiceState || (isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle');

  const getVisualConfig = () => {
    if (effectiveVoiceState === 'listening') {
      return {
        label: 'LISTENING...',
        color: 'bg-[#A7F3D0]',
        ringColor: 'border-emerald-600',
        eyeShape: 'rounded-full scale-125 bg-[#0F172A]',
        mouthType: 'listening',
        icon: Mic,
        indicator: 'bg-emerald-500 animate-ping',
      };
    }
    if (effectiveVoiceState === 'speaking') {
      return {
        label: 'SPEAKING...',
        color: 'bg-[#C4B5FD]',
        ringColor: 'border-indigo-600',
        eyeShape: 'rounded-full scale-110 bg-[#0F172A]',
        mouthType: 'speaking',
        icon: Volume2,
        indicator: 'bg-indigo-500 animate-pulse',
      };
    }
    if (effectiveVoiceState === 'thinking') {
      return {
        label: 'THINKING...',
        color: 'bg-[#FDE68A]',
        ringColor: 'border-amber-600',
        eyeShape: 'rounded-xs scale-90 -translate-y-0.5 bg-[#0F172A] animate-bounce',
        mouthType: 'thinking',
        icon: Brain,
        indicator: 'bg-amber-500 animate-spin',
      };
    }
    if (effectiveVoiceState === 'error') {
      return {
        label: 'ATTENTION',
        color: 'bg-[#FED7AA]',
        ringColor: 'border-rose-600',
        eyeShape: 'rounded-xs translate-y-0.5 bg-rose-950',
        mouthType: 'concerned',
        icon: AlertCircle,
        indicator: 'bg-rose-500',
      };
    }

    // Default by pedagogical expression
    switch (expression) {
      case 'greeting':
        return {
          label: 'HELLO!',
          color: 'bg-[#C4B5FD]',
          ringColor: 'border-[#0F172A]',
          eyeShape: 'rounded-full scale-110 bg-[#0F172A]',
          mouthType: 'smile',
          icon: Smile,
          indicator: 'bg-indigo-500',
        };
      case 'encouraging':
        return {
          label: 'YOU GOT THIS!',
          color: 'bg-[#BAE6FD]',
          ringColor: 'border-sky-600',
          eyeShape: 'rounded-full bg-[#0F172A]',
          mouthType: 'smile',
          icon: Sparkles,
          indicator: 'bg-sky-500',
        };
      case 'celebrating':
        return {
          label: 'BRILLIANT!',
          color: 'bg-[#A7F3D0]',
          ringColor: 'border-emerald-600',
          eyeShape: 'h-1.5 w-3.5 bg-[#0F172A] rounded-full rotate-6',
          mouthType: 'laugh',
          icon: CheckCircle,
          indicator: 'bg-emerald-500',
        };
      case 'concerned':
        return {
          label: 'LET\'S UNTANGLE',
          color: 'bg-[#FED7AA]',
          ringColor: 'border-amber-700',
          eyeShape: 'rounded-xs translate-y-0.5 bg-[#0F172A]',
          mouthType: 'concerned',
          icon: AlertCircle,
          indicator: 'bg-amber-600',
        };
      case 'explaining':
      default:
        return {
          label: 'MENTORING',
          color: 'bg-[#E2E8F0]',
          ringColor: 'border-[#0F172A]',
          eyeShape: 'rounded-full bg-[#0F172A]',
          mouthType: 'neutral',
          icon: Bot,
          indicator: 'bg-slate-700',
        };
    }
  };

  const config = getVisualConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-10 h-10',
    compact: 'w-11 h-11',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  return (
    <div className="flex flex-col items-center gap-1.5 font-mono select-none">
      <div className="relative group">
        {/* Animated aura ring if listening, speaking, or thinking */}
        {(effectiveVoiceState === 'listening' ||
          effectiveVoiceState === 'speaking' ||
          effectiveVoiceState === 'thinking') && (
          <div
            className={`absolute -inset-1.5 rounded-sm border-2 border-dashed ${config.ringColor} ${
              effectiveVoiceState === 'thinking' ? 'animate-spin duration-1000' : 'animate-pulse'
            }`}
          />
        )}

        {/* Avatar Head container */}
        <div
          className={`${sizeClasses} bg-[#1E1B4B] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] rounded-md flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300`}
        >
          {/* Glowing Mini Halo */}
          <div className="absolute top-0.5 w-6 h-1 rounded-full border border-indigo-300 bg-indigo-400/40 shadow-[0_0_8px_rgba(167,139,250,0.9)] animate-pulse z-10" />
          <img
            src="/assets/nova-robot.png"
            alt="NOVA Avatar"
            className="w-full h-full object-contain p-0.5 drop-shadow-[0_2px_6px_rgba(99,102,241,0.5)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/nova-robot.png';
            }}
          />
        </div>

        {/* Status Mini-Badge Icon */}
        <div className="absolute -bottom-1 -right-1 bg-white border border-[#0F172A] p-0.5 shadow-[1px_1px_0px_#0F172A]">
          <Icon className="w-3 h-3 text-[#0F172A]" />
        </div>
      </div>

      {/* Expression / State Label Pill */}
      {showLabel && (
        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-[#0F172A] text-white border border-[#0F172A] tracking-wider shadow-[1px_1px_0px_#C4B5FD]">
          NOVA // {config.label}
        </span>
      )}
    </div>
  );
};

export default NovaAvatar;

