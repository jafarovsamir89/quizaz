import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const getColor = (type: Toast['type']) => {
    if (type === 'success') return 'var(--success)';
    if (type === 'info') return 'var(--secondary-blue)';
    return 'var(--error)';
  };

  const getBg = (type: Toast['type']) => {
    if (type === 'success') return 'rgba(0,230,118,0.12)';
    if (type === 'info') return 'rgba(0,191,255,0.12)';
    return 'rgba(255,68,119,0.12)';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: 'min(92vw, 400px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-in"
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 14,
              fontWeight: 600,
              fontSize: '0.875rem',
              background: getBg(t.type),
              border: `1px solid ${getColor(t.type)}33`,
              color: getColor(t.type),
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
