import React from 'react';
import { NovaAvatarExpression } from '../types';
import { Sparkles, Bot, Brain, Smile, CheckCircle, AlertCircle, Mic, Volume2 } from 'lucide-react';

export type NovaVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface NovaAvatarProps {
  expression?: NovaAvatarExpression;
  voiceState?: NovaVoiceState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
          className={`${sizeClasses} ${config.color} border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] rounded-sm flex flex-col items-center justify-between p-2 relative overflow-hidden transition-all duration-300`}
        >
          {/* Futuristic Cyber Antennas / Visor Grid */}
          <div className="w-full flex justify-between items-center opacity-80">
            <div className="w-1.5 h-1 bg-[#0F172A]" />
            <div className="flex items-center gap-1">
              <span className={`w-1 h-1 rounded-full ${config.indicator}`} />
              <span className="w-1.5 h-0.5 bg-[#0F172A]" />
              <span className={`w-1 h-1 rounded-full ${config.indicator}`} />
            </div>
            <div className="w-1.5 h-1 bg-[#0F172A]" />
          </div>

          {/* Expressive Digital Eyes */}
          <div className="flex items-center gap-3 my-auto">
            <div
              className={`w-2.5 h-2.5 border border-[#0F172A] transition-all duration-200 ${config.eyeShape}`}
            />
            <div
              className={`w-2.5 h-2.5 border border-[#0F172A] transition-all duration-200 ${config.eyeShape} ${
                effectiveVoiceState === 'thinking' ? 'delay-100' : ''
              }`}
            />
          </div>

          {/* Expressive Mouth / Dynamic Speaking Equalizer */}
          <div className="flex items-center justify-center h-3">
            {config.mouthType === 'speaking' ? (
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 bg-[#0F172A] h-2.5 animate-pulse" />
                <span className="w-0.5 bg-[#0F172A] h-3.5 animate-pulse delay-75" />
                <span className="w-0.5 bg-[#0F172A] h-1.5 animate-pulse delay-150" />
                <span className="w-0.5 bg-[#0F172A] h-3 animate-pulse delay-100" />
                <span className="w-0.5 bg-[#0F172A] h-2 animate-pulse" />
              </div>
            ) : config.mouthType === 'listening' ? (
              <div className="w-4 h-1.5 bg-[#0F172A] rounded-full animate-pulse" />
            ) : config.mouthType === 'laugh' ? (
              <div className="w-5 h-2.5 bg-[#0F172A] rounded-b-full" />
            ) : config.mouthType === 'concerned' ? (
              <div className="w-3.5 h-1 border-t-2 border-[#0F172A] rounded-t-full" />
            ) : config.mouthType === 'thinking' ? (
              <div className="w-3 h-0.5 bg-[#0F172A]" />
            ) : (
              <div className="w-3.5 h-1.5 border-b-2 border-[#0F172A] rounded-b-full" />
            )}
          </div>
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

