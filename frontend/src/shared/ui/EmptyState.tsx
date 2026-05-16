import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in glass-card border-dashed">
      {icon && <div className="text-text-muted mb-4 opacity-50">{icon}</div>}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description && <p className="text-text-muted text-sm mb-6 max-w-[250px]">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" className="px-8">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
