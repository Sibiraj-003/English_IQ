import React from 'react';
import { AlertCircle } from 'lucide-react';
import { BrutalButton } from './BrutalButton';

interface EmptyStateProps {
  label: string; // e.g. "TEXTBOOK_LIBRARY // EMPTY"
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  accent?: 'lavender' | 'mint' | 'amber' | 'sky';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  label,
  title,
  description,
  actionText,
  onAction,
  accent = 'amber',
}) => {
  return (
    <div className="p-8 text-center border-2 border-[#0F172A] bg-white shadow-[4px_4px_0px_#0F172A]">
      <div className="inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold bg-[#0F172A] text-white border-2 border-[#0F172A] mb-4">
        <AlertCircle className="w-3.5 h-3.5 text-[#FDE68A]" />
        {label}
      </div>
      <h3 className="text-xl font-extrabold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-600 max-w-md mx-auto mb-6">{description}</p>
      {actionText && onAction && (
        <BrutalButton variant={accent} onClick={onAction}>
          [ {actionText} ]
        </BrutalButton>
      )}
    </div>
  );
};
