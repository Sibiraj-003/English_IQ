import React from 'react';
import { BookOpen } from 'lucide-react';

interface SourceBadgeProps {
  bookTitle?: string;
  pageNumber?: number;
  lessonTitle?: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  bookTitle = 'Curriculum Textbook',
  pageNumber = 1,
  lessonTitle,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-bold bg-[#BAE6FD] text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${className}`}
    >
      <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
      <span>
        SOURCE: <span className="uppercase">{bookTitle}</span> // PAGE {pageNumber}
        {lessonTitle ? ` (${lessonTitle})` : ''}
      </span>
    </div>
  );
};
