import React from 'react';

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'normal' | 'large' | 'small' | 'medium';
  accent?: 'lavender' | 'mint' | 'amber' | 'sky' | 'pink' | 'none' | 'yellow';
}

export const BrutalCard: React.FC<BrutalCardProps> = ({
  children,
  size = 'normal',
  accent = 'none',
  className = '',
  ...props
}) => {
  const normAccent = accent === 'yellow' ? 'amber' : accent;
  const accentBorder = {
    none: '',
    lavender: 'border-t-8 border-t-[#C4B5FD]',
    mint: 'border-t-8 border-t-[#A7F3D0]',
    amber: 'border-t-8 border-t-[#FDE68A]',
    sky: 'border-t-8 border-t-[#BAE6FD]',
    pink: 'border-t-8 border-t-[#FBCFE8]',
  }[normAccent];

  const shadowClass = size === 'large' ? 'brutal-card-lg' : 'brutal-card';

  return (
    <div className={`${shadowClass} ${accentBorder} ${className}`} {...props}>
      {children}
    </div>
  );
};
