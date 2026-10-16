import React from 'react';

interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'lavender' | 'mint' | 'amber' | 'sky' | 'pink' | 'white' | 'danger' | 'neutral' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const normVariant = variant === 'neutral' ? 'white' : variant === 'secondary' ? 'lavender' : variant;
  const normSize = size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : size;

  const variantStyles = {
    primary: 'bg-[#0F172A] text-white hover:bg-[#1E293B]',
    lavender: 'bg-[#C4B5FD] text-[#0F172A] hover:bg-[#B3A1FC]',
    mint: 'bg-[#A7F3D0] text-[#0F172A] hover:bg-[#86EFAC]',
    amber: 'bg-[#FDE68A] text-[#0F172A] hover:bg-[#FCD34D]',
    sky: 'bg-[#BAE6FD] text-[#0F172A] hover:bg-[#7DD3FC]',
    pink: 'bg-[#FBCFE8] text-[#0F172A] hover:bg-[#F9A8D4]',
    white: 'bg-white text-[#0F172A] hover:bg-slate-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  }[normVariant];

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }[normSize];

  return (
    <button
      disabled={disabled}
      className={`brutal-btn ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
