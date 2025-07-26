// src/components/ToastContainer.tsx
import React from 'react';
import Toast, { ToastData } from './Toast';
import './ToastContainer.css';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  // エラー系（上部表示）とその他（下部表示）に分ける
  const errorToasts = toasts.filter(toast => toast.type === 'error');
  const otherToasts = toasts.filter(toast => toast.type !== 'error');

  return (
    <>
      {/* エラートースト（画面上部） */}
      {errorToasts.length > 0 && (
        <div className="toast-container toast-container-top">
          {errorToasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={onRemove}
            />
          ))}
        </div>
      )}

      {/* 通知トースト（画面下部） */}
      {otherToasts.length > 0 && (
        <div className="toast-container toast-container-bottom">
          {otherToasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={onRemove}
            />
          ))}
        </div>
      )}
    </>
  );
}
