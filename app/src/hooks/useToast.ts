// src/hooks/useToast.ts
import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';

export interface ToastData {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
  autoHide?: boolean;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (message: string, options?: Partial<ToastData>) => void;
  showError: (message: string, options?: Partial<ToastData>) => void;
  showInfo: (message: string, options?: Partial<ToastData>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // トースト追加
  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = {
      id,
      autoHide: true,
      duration: toast.type === 'error' ? 0 : 4000, // エラーは手動で閉じる
      ...toast,
    };

    logger.debug('トースト表示', { 
      type: newToast.type, 
      message: newToast.message,
      autoHide: newToast.autoHide 
    });

    setToasts(prev => {
      // 最大5つまで表示（古いものから削除）
      const updated = [...prev, newToast];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });
  }, []);

  // 成功トースト
  const showSuccess = useCallback((message: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'success',
      message,
      autoHide: true,
      duration: 3000,
      ...options,
    });
  }, [showToast]);

  // エラートースト（常駐）
  const showError = useCallback((message: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'error',
      message,
      autoHide: false, // エラーは手動で閉じる
      ...options,
    });
  }, [showToast]);

  // 情報トースト
  const showInfo = useCallback((message: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'info',
      message,
      autoHide: true,
      duration: 4000,
      ...options,
    });
  }, [showToast]);

  // トースト削除
  const removeToast = useCallback((id: string) => {
    logger.debug('トースト削除', { id });
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 全削除
  const clearAll = useCallback(() => {
    logger.debug('全トースト削除');
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast,
    clearAll,
  };
}
