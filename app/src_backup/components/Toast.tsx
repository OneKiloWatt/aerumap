// src/components/Toast.tsx
import React from 'react';
import './Toast.css';

export interface ToastData {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
  autoHide?: boolean;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const { id, type, message, autoHide = true, duration = 4000 } = toast;

  // 自動消失タイマー
  React.useEffect(() => {
    if (!autoHide) return;

    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, autoHide, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const handleClose = () => {
    onClose(id);
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
}
