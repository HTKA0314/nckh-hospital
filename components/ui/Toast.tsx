'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmDialogOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = 'success',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  );
  const error = useCallback(
    (message: string, title?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  );
  const info = useCallback(
    (message: string, title?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  );

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const handleConfirmSubmit = async () => {
    if (!confirmDialog) return;
    try {
      setConfirmLoading(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info, confirm }}>
      {children}

      {/* 1. TOP-RIGHT TOAST NOTIFICATION CONTAINER */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-9999 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-2 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4 fade-in ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-900/10'
                  : isError
                  ? 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-900/10'
                  : isWarning
                  ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-900/10'
                  : 'bg-blue-50/95 border-blue-300 text-blue-950 shadow-blue-900/10'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <XCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {isInfo && <Info className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && <h4 className="text-xs font-bold uppercase tracking-wide opacity-90 mb-0.5">{t.title}</h4>}
                <p className="text-[13px] font-medium leading-relaxed">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-9999 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : confirmDialog.type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-[#0A6EBD]'
                  }`}
                >
                  {confirmDialog.type === 'danger' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : confirmDialog.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900">{confirmDialog.title}</h3>
                  <span className="text-xs text-slate-500 font-medium">Yêu cầu xác nhận hành động</span>
                </div>
              </div>

              <p className="text-[14px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {confirmDialog.message}
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={confirmLoading}
                className="px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {confirmDialog.cancelLabel || 'Hủy bỏ'}
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={confirmLoading}
                className={`px-4 py-2 text-[13px] font-bold text-white rounded-xl transition shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#0A6EBD] hover:bg-[#085896]'
                }`}
              >
                {confirmLoading ? 'Đang xử lý...' : confirmDialog.confirmLabel || 'Xác nhận thực hiện'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
