import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'dark' | 'lavender' | 'mint' | 'amber' | 'sky' | 'pink' | 'white' | 'danger';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'dark',
  className = '',
}) => {
  const variantStyles = {
    dark: 'bg-[#0F172A] text-white',
    lavender: 'bg-[#C4B5FD] text-[#0F172A]',
    mint: 'bg-[#A7F3D0] text-[#0F172A]',
    amber: 'bg-[#FDE68A] text-[#0F172A]',
    sky: 'bg-[#BAE6FD] text-[#0F172A]',
    pink: 'bg-[#FBCFE8] text-[#0F172A]',
    white: 'bg-white text-[#0F172A]',
    danger: 'bg-rose-500 text-white',
  }[variant];

  return <span className={`brutal-badge ${variantStyles} ${className}`}>{children}</span>;
};
