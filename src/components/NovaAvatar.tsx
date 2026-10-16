import React from 'react';
import { NovaAvatarExpression } from '../types';
import { Sparkles, Bot, Brain, Smile, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';

interface NovaAvatarProps {
  expression?: NovaAvatarExpression;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NovaAvatar: React.FC<NovaAvatarProps> = ({
  expression = 'greeting',
  isSpeaking = false,
  isThinking = false,
  size = 'md',
}) => {
  const getExpressionData = () => {
    switch (expression) {
      case 'greeting':
        return {
          label: 'HELLO!',
          color: 'bg-[#C4B5FD]',
          eyeShape: 'rounded-full scale-110',
          mouth: 'w-4 h-2 border-b-2 border-[#0F172A] rounded-b-full',
          icon: Smile,
        };
      case 'thinking':
        return {
          label: 'PONDERING...',
          color: 'bg-[#FDE68A]',
          eyeShape: 'rounded-sm scale-90 -translate-y-0.5',
          mouth: 'w-3 h-0.5 bg-[#0F172A]',
          icon: Brain,
        };
      case 'encouraging':
        return {
          label: 'YOU GOT THIS!',
          color: 'bg-[#BAE6FD]',
          eyeShape: 'rounded-full',
          mouth: 'w-4 h-2 border-b-2 border-[#0F172A] rounded-b-full',
          icon: Sparkles,
        };
      case 'celebrating':
        return {
          label: 'BRILLIANT! 🎉',
          color: 'bg-[#A7F3D0]',
          eyeShape: 'h-1.5 w-3.5 bg-[#0F172A] rounded-full rotate-6',
          mouth: 'w-5 h-3 bg-[#0F172A] rounded-b-full',
          icon: CheckCircle,
        };
      case 'concerned':
        return {
          label: 'LET\'S UNTANGLE',
          color: 'bg-[#FED7AA]',
          eyeShape: 'rounded-sm translate-y-0.5',
          mouth: 'w-3 h-1 border-t-2 border-[#0F172A] rounded-t-full',
          icon: AlertCircle,
        };
      case 'explaining':
      default:
        return {
          label: 'TEACHING...',
          color: 'bg-[#E2E8F0]',
          eyeShape: 'rounded-full',
          mouth: 'w-3.5 h-1 border-b-2 border-[#0F172A]',
          icon: Bot,
        };
    }
  };

  const data = getExpressionData();
  const Icon = data.icon;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  return (
    <div className="flex flex-col items-center gap-1.5 font-mono select-none">
      <div className="relative">
        {/* Animated aura ring if speaking or thinking */}
        {(isSpeaking || isThinking) && (
          <div
            className={`absolute -inset-1.5 rounded-sm border-2 border-dashed border-[#0F172A] animate-spin ${
              isThinking ? 'duration-1000' : 'duration-300'
            }`}
          />
        )}

        {/* Avatar Head container */}
        <div
          className={`${sizeClasses} ${data.color} border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] rounded-sm flex flex-col items-center justify-between p-2 relative overflow-hidden transition-all duration-300`}
        >
          {/* Futuristic Cyber Antennas / Visor Grid */}
          <div className="w-full flex justify-between items-center opacity-70">
            <div className="w-1.5 h-1 bg-[#0F172A]" />
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
              <span className="w-1 h-1 bg-[#0F172A] rounded-full" />
            </div>
            <div className="w-1.5 h-1 bg-[#0F172A]" />
          </div>

          {/* Expressive Digital Eyes */}
          <div className="flex items-center gap-2.5 my-auto">
            <div
              className={`w-2.5 h-2.5 bg-[#0F172A] border border-[#0F172A] transition-all duration-200 ${
                isThinking ? 'animate-bounce' : ''
              } ${data.eyeShape}`}
            />
            <div
              className={`w-2.5 h-2.5 bg-[#0F172A] border border-[#0F172A] transition-all duration-200 ${
                isThinking ? 'animate-bounce delay-100' : ''
              } ${data.eyeShape}`}
            />
          </div>

          {/* Expressive Mouth */}
          <div className="flex items-center justify-center">
            <div
              className={`transition-all duration-200 ${data.mouth} ${
                isSpeaking ? 'animate-pulse scale-125' : ''
              }`}
            />
          </div>
        </div>

        {/* Status Mini-Badge Icon */}
        <div className="absolute -bottom-1 -right-1 bg-white border border-[#0F172A] p-0.5 shadow-[1px_1px_0px_#0F172A]">
          <Icon className="w-2.5 h-2.5 text-[#0F172A]" />
        </div>
      </div>

      {/* Expression Label Pill */}
      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-[#0F172A] text-white border border-[#0F172A] tracking-wider shadow-[1px_1px_0px_#C4B5FD]">
        NOVA // {data.label}
      </span>
    </div>
  );
};
