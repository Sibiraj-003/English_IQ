import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  percent?: number;
  stageMessage?: string;
  stagesCompleted?: string[];
  statusBadge?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'TEXTBOOK_PROCESSOR',
  percent = 80,
  stageMessage = 'EXTRACTING PAGE 42 / 51',
  stagesCompleted = [
    'TEXT EXTRACTED',
    'LESSONS IDENTIFIED',
    'GRAMMAR INDEXED',
    'VOCABULARY INDEXED',
    'VECTOR INDEX CREATED',
  ],
  statusBadge = 'PROCESSING // IN_PROGRESS',
}) => {
  // ASCII / block progress bar
  const totalBlocks = 16;
  const filledBlocks = Math.round((percent / 100) * totalBlocks);
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <div className="p-6 border-2 border-[#0F172A] bg-white shadow-[4px_4px_0px_#0F172A] max-w-xl mx-auto font-mono">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-4">
        <span className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
          {title}
        </span>
        <span className="text-xs font-bold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
          {statusBadge}
        </span>
      </div>

      {/* Progress display */}
      <div className="bg-[#0F172A] text-[#A7F3D0] p-4 border border-[#0F172A] mb-4 shadow-[2px_2px_0px_#0F172A]">
        <div className="flex justify-between items-center text-xs mb-2 text-white">
          <span>PROGRESS</span>
          <span className="font-bold">{percent}%</span>
        </div>
        <div className="text-lg tracking-wider select-none font-bold text-emerald-400 mb-2">
          {progressBar} <span className="text-white text-xs">{percent}%</span>
        </div>
        <div className="text-xs text-[#FDE68A] uppercase tracking-wide">
          &gt; {stageMessage}
        </div>
      </div>

      {/* Pipeline checklist */}
      <div className="space-y-1.5 text-xs">
        {stagesCompleted.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-2 text-slate-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>✓ {stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
