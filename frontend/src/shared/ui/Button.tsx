import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading, 
  disabled,
  style,
  ...props 
}) => {
  return (
    <button 
      className={cn(
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        isLoading && 'opacity-70 pointer-events-none',
        className
      )}
      disabled={isLoading || disabled}
      style={{ opacity: disabled ? 0.4 : undefined, ...style }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 16, height: 16,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block'
          }} className="animate-spin" />
          Gözləyin...
        </span>
      ) : children}
    </button>
  );
};
